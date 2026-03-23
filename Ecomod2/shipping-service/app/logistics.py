import uuid
import random
from datetime import datetime, timedelta

# Tarifas por departamento (simuladas — en producción se llamaría a la API del transportista)
SHIPPING_RATES = {
    "Bogotá":          {"cost": 8500,  "days": 1},
    "Antioquia":       {"cost": 9000,  "days": 2},
    "Valle del Cauca": {"cost": 9500,  "days": 2},
    "Atlántico":       {"cost": 11000, "days": 3},
    "Bolívar":         {"cost": 11500, "days": 3},
    "Cundinamarca":    {"cost": 8500,  "days": 1},
    "Santander":       {"cost": 10000, "days": 2},
    "Córdoba":         {"cost": 12000, "days": 3},
    "Nariño":          {"cost": 13000, "days": 4},
    "Meta":            {"cost": 11000, "days": 3},
}

DEFAULT_RATE = {"cost": 14000, "days": 5}

CARRIERS = ["Servientrega", "Interrapidísimo", "Coordinadora", "TCC", "Deprisa"]


def calculate_shipping_cost(department: str, carrier: str = "Servientrega") -> dict:
    """Calcula el costo de envío según el departamento."""
    rate = SHIPPING_RATES.get(department, DEFAULT_RATE)

    # Ajuste por transportista
    carrier_multiplier = {
        "Servientrega": 1.0,
        "Interrapidísimo": 0.95,
        "Coordinadora": 1.05,
        "TCC": 1.1,
        "Deprisa": 1.15,
    }.get(carrier, 1.0)

    cost = round(rate["cost"] * carrier_multiplier)
    days = rate["days"]

    return {
        "cost": cost,
        "estimated_days": days,
        "estimated_delivery": datetime.utcnow() + timedelta(days=days)
    }


def generate_tracking_number(carrier: str) -> str:
    """Genera un número de tracking simulado."""
    prefix = {
        "Servientrega": "SRV",
        "Interrapidísimo": "IRP",
        "Coordinadora": "CRD",
        "TCC": "TCC",
        "Deprisa": "DPR",
    }.get(carrier, "SHP")

    return f"{prefix}-{uuid.uuid4().hex[:10].upper()}"