from pydantic import BaseModel, Field


class DrugInfoItem(BaseModel):
    title: str = Field(..., description="Название секции/препарата")
    indication: str | None = Field(None, description="Показания к применению")
    warnings: str | None = Field(None, description="Ключевые предупреждения")
    source: str = Field(default="openfda", description="Источник данных")


class DrugInfoResponse(BaseModel):
    query: str
    items: list[DrugInfoItem]
    source_available: bool = True


class DrugInfoImportRequest(BaseModel):
    """Импорт из внешнего API: длинные строки RxNav не помещаются в query-параметры."""

    title: str = Field(..., min_length=2, max_length=4000)
    indication: str | None = Field(None, max_length=8000)
    warnings: str | None = Field(None, max_length=8000)
