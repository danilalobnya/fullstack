from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.database import get_db
from app.models import db_models
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPairResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _normalize_phone(value: str) -> str:
    # РћСЃС‚Р°РІР»СЏРµРј С‚РѕР»СЊРєРѕ С†РёС„СЂС‹ РґР»СЏ СѓСЃС‚РѕР№С‡РёРІРѕРіРѕ СЃСЂР°РІРЅРµРЅРёСЏ (+7 999... == +7999...)
    return "".join(ch for ch in value if ch.isdigit())


@router.post("/login", response_model=TokenPairResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Р’С…РѕРґ РІ СЃРёСЃС‚РµРјСѓ
    РџСЂРѕРІРµСЂРєР° РЅРѕРјРµСЂР° С‚РµР»РµС„РѕРЅР° Рё РїР°СЂРѕР»СЏ
    Р’РѕР·РІСЂР°С‰Р°РµС‚ JWT С‚РѕРєРµРЅ
    """
    user = db.query(db_models.User).filter(db_models.User.phone == credentials.phone).first()
    if not user:
        normalized = _normalize_phone(credentials.phone)
        # Fallback РґР»СЏ СЃС‚Р°СЂС‹С… РґР°РЅРЅС‹С… РІ Р‘Р” СЃ СЂР°Р·РЅС‹РјРё С„РѕСЂРјР°С‚Р°РјРё С‚РµР»РµС„РѕРЅР°
        for candidate in db.query(db_models.User).all():
            if _normalize_phone(candidate.phone) == normalized:
                user = candidate
                break
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="РќРµРІРµСЂРЅС‹Р№ С‚РµР»РµС„РѕРЅ РёР»Рё РїР°СЂРѕР»СЊ",
        )
    access = create_access_token({"sub": str(user.id)})
    refresh = create_refresh_token({"sub": str(user.id)})

    db_refresh = db_models.RefreshToken(
        user_id=user.id,
        token=refresh,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        revoked=False,
    )
    db.add(db_refresh)
    db.commit()
    return TokenPairResponse(
        access_token=access,
        refresh_token=refresh,
        user_id=user.id,
        role=user.role,
    )


@router.post("/register", response_model=UserResponse)
def register(user_data: RegisterRequest, db: Session = Depends(get_db)):
    """
    Р РµРіРёСЃС‚СЂР°С†РёСЏ РЅРѕРІРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
    РЎРѕР·РґР°РµС‚ Р°РєРєР°СѓРЅС‚ СЃ РЅРѕРјРµСЂРѕРј С‚РµР»РµС„РѕРЅР°, РїР°СЂРѕР»РµРј Рё РёРјРµРЅРµРј
    """
    normalized = _normalize_phone(user_data.phone)
    existing = db.query(db_models.User).filter(db_models.User.phone == user_data.phone).first()
    if not existing:
        for candidate in db.query(db_models.User).all():
            if _normalize_phone(candidate.phone) == normalized:
                existing = candidate
                break
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ СЃ С‚Р°РєРёРј С‚РµР»РµС„РѕРЅРѕРј СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚",
        )

    # РџРѕ СѓРјРѕР»С‡Р°РЅРёСЋ РІСЃРµРј РЅРѕРІС‹Рј РїРѕР»СЊР·РѕРІР°С‚РµР»СЏРј РЅР°Р·РЅР°С‡Р°РµРј СЂРѕР»СЊ "user"
    user = db_models.User(
        phone=user_data.phone,
        name=user_data.name,
        password_hash=get_password_hash(user_data.password),
        sms_notifications=True,
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse(id=user.id, phone=user.phone, name=user.name, role=user.role)


@router.post("/refresh", response_model=TokenPairResponse)
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    """
    РћР±РЅРѕРІР»РµРЅРёРµ С‚РѕРєРµРЅР°
    """
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh" or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="РќРµРІРµСЂРЅС‹Р№ refresh-С‚РѕРєРµРЅ")

    token_row = (
        db.query(db_models.RefreshToken)
        .filter(db_models.RefreshToken.token == data.refresh_token, db_models.RefreshToken.revoked.is_(False))
        .first()
    )
    expires_at = token_row.expires_at if token_row else None
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not token_row or (expires_at and expires_at < datetime.now(timezone.utc)):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh-С‚РѕРєРµРЅ РёСЃС‚РµРє РёР»Рё РѕС‚РѕР·РІР°РЅ")

    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError, JWTError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="РќРµРІРµСЂРЅС‹Р№ С‚РѕРєРµРЅ")

    user = db.get(db_models.User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ")

    # rotate refresh
    token_row.revoked = True
    new_refresh = create_refresh_token({"sub": str(user.id)})
    new_access = create_access_token({"sub": str(user.id)})
    db.add(
        db_models.RefreshToken(
            user_id=user.id,
            token=new_refresh,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            revoked=False,
        )
    )
    db.commit()

    return TokenPairResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        user_id=user.id,
        role=user.role,
    )

