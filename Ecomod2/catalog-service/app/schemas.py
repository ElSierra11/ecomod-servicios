from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
import json

# ============= CATEGORÍAS =============

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CategoryWithProducts(CategoryResponse):
    products: List["ProductResponse"] = []

# ============= PRODUCTOS =============

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    category_id: Optional[int] = None
    image_urls: Optional[List[str]] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    category_id: Optional[int] = None
    image_urls: Optional[List[str]] = None

class ProductResponse(ProductBase):
    id: int
    category: Optional[CategoryResponse] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def model_validate(cls, obj):
        """Convertir de ORM a Pydantic manejando image_urls correctamente"""
        data = {
            'id': obj.id,
            'name': obj.name,
            'description': obj.description,
            'price': obj.price,
            'category_id': obj.category_id,
            'created_at': obj.created_at,
            'updated_at': obj.updated_at,
            'category': obj.category,
        }

        raw = obj.image_urls
        if not raw:
            data['image_urls'] = []
        elif isinstance(raw, list):
            data['image_urls'] = raw
        elif isinstance(raw, str):
            try:
                parsed = json.loads(raw)
                data['image_urls'] = parsed if isinstance(parsed, list) else []
            except Exception:
                data['image_urls'] = []
        else:
            data['image_urls'] = []

        return cls(**data)

# ============= RESPUESTAS GENÉRICAS =============

class MessageResponse(BaseModel):
    message: str
    product_id: Optional[int] = None
    category_id: Optional[int] = None

# Actualizar referencias adelantadas
CategoryWithProducts.model_rebuild()