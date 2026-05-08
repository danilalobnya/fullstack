from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models import db_models
from app.schemas.medications import MedicationResponse
from app.schemas.external_api import DrugInfoImportRequest, DrugInfoResponse
from app.services.external_drug_api import ExternalApiRateLimitError, search_drug_info

router = APIRouter(prefix="/external", tags=["External API"])


@router.get("/drug-info", response_model=DrugInfoResponse)
async def get_drug_info(
    query: str = Query(
        ...,
        min_length=2,
        max_length=2000,
        description="Название лекарства (длинные имена из RxNav допускаются)",
    ),
    current_user: db_models.User = Depends(get_current_user),
):
    _ = current_user
    try:
        result = await search_drug_info(query)
    except ExternalApiRateLimitError as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc))
    return DrugInfoResponse(
        query=query,
        items=result.items,
        source_available=result.source_available,
    )


@router.post("/drug-info/import", response_model=MedicationResponse)
def import_drug_info_to_catalog(
    body: DrugInfoImportRequest,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    title = body.title.strip()
    indication = (body.indication or "").strip() or None
    warnings = (body.warnings or "").strip() or None
    existing = (
        db.query(db_models.Medication)
        .filter(
            db_models.Medication.user_id == current_user.id,
            db_models.Medication.name.ilike(title),
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Лекарство с таким названием уже есть в вашем каталоге",
        )

    description_parts = [p for p in [indication, warnings] if p]
    medication = db_models.Medication(
        user_id=current_user.id,
        name=title,
        quantity="1 таблетка",
        dosage="по инструкции",
        description="\n\n".join(description_parts) if description_parts else "Импортировано из внешнего API",
        take_with_food="with",
    )
    db.add(medication)
    db.commit()
    db.refresh(medication)
    return MedicationResponse(
        id=medication.id,
        name=medication.name,
        quantity=medication.quantity,
        dosage=medication.dosage,
        description=medication.description,
        take_with_food=medication.take_with_food,
    )
