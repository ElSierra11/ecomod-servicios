from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import SessionLocal
from app import models, schemas
from app.auth import require_admin

router = APIRouter(prefix="/catalog", tags=["Catalog"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/health")
def health():
    return {"status": "healthy", "service": "catalog-service", "timestamp": datetime.utcnow().isoformat()}

@router.get("/products", response_model=List[schemas.ProductResponse])
def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(models.Product)
    if search:
        query = query.filter(models.Product.name.ilike(f"%{search}%"))
    if min_price is not None:
        query = query.filter(models.Product.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Product.price <= max_price)
    products = query.offset(skip).limit(limit).all()
    return [schemas.ProductResponse.model_validate(p) for p in products]

@router.get("/products/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return schemas.ProductResponse.model_validate(product)

@router.post("/products", response_model=schemas.MessageResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), token: dict = Depends(require_admin)):
    existing = db.query(models.Product).filter(models.Product.name == product.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product with this name already exists")
    if product.category_id:
        category = db.query(models.Category).filter(models.Category.id == product.category_id).first()
        if not category:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category not found")
    image_urls_json = None
    if product.image_urls:
        import json
        image_urls_json = json.dumps(product.image_urls)
    db_product = models.Product(
        name=product.name, description=product.description,
        price=product.price, category_id=product.category_id,
        image_urls=image_urls_json
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return {"message": "Product created successfully", "product_id": db_product.id}

@router.put("/products/{product_id}", response_model=schemas.MessageResponse)
def update_product(product_id: int, product_update: schemas.ProductUpdate, db: Session = Depends(get_db), token: dict = Depends(require_admin)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    update_data = product_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "image_urls" and value is not None:
            import json
            setattr(db_product, field, json.dumps(value))
        else:
            setattr(db_product, field, value)
    db.commit()
    db.refresh(db_product)
    return {"message": "Product updated successfully", "product_id": db_product.id}

@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db), token: dict = Depends(require_admin)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    db.delete(db_product)
    db.commit()
    return None

@router.get("/")
def root():
    return {"service": "Catalog Service", "version": "1.0.0"}

@router.get("/categories", response_model=List[schemas.CategoryResponse])
def get_categories(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000), db: Session = Depends(get_db)):
    return db.query(models.Category).offset(skip).limit(limit).all()

@router.get("/categories/{category_id}", response_model=schemas.CategoryWithProducts)
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category

@router.post("/categories", response_model=schemas.MessageResponse, status_code=status.HTTP_201_CREATED)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db), token: dict = Depends(require_admin)):
    existing = db.query(models.Category).filter(models.Category.name == category.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category with this name already exists")
    db_category = models.Category(name=category.name, description=category.description)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return {"message": "Category created successfully", "category_id": db_category.id}

@router.put("/categories/{category_id}", response_model=schemas.MessageResponse)
def update_category(category_id: int, category_update: schemas.CategoryUpdate, db: Session = Depends(get_db), token: dict = Depends(require_admin)):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    update_data = category_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)
    db.commit()
    db.refresh(db_category)
    return {"message": "Category updated successfully", "category_id": db_category.id}

@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db), token: dict = Depends(require_admin)):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    products_count = db.query(models.Product).filter(models.Product.category_id == category_id).count()
    if products_count > 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot delete category with {products_count} products.")
    db.delete(db_category)
    db.commit()
    return None

@router.get("/categories/{category_id}/products", response_model=List[schemas.ProductResponse])
def get_products_by_category(category_id: int, skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000), db: Session = Depends(get_db)):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    products = db.query(models.Product).filter(models.Product.category_id == category_id).offset(skip).limit(limit).all()
    return products