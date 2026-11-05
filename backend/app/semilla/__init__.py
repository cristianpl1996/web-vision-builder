"""Catálogo inicial: las 5 presentaciones de SINERGIA y las 3 que BOTICAN enviará.

Corre al arrancar el contenedor y SOLO si la tabla de productos está vacía: después de la
primera vez, el catálogo se administra desde Admin › Productos. Los datos salen de las
etiquetas de los frascos; los precios son de referencia hasta que BOTICAN los confirme.
"""

import asyncio
import shutil
from pathlib import Path

from sqlalchemy import func, select

from app.config import settings
from app.db import SessionLocal
from app.modelos import Foto, Producto

AQUI = Path(__file__).parent
TERPENOS = "Linalol, mirceno, nerodiol"

# mg, volumen, mg/ml de CBD, mg/ml de CBG, precio de referencia
PRESENTACIONES = [
    (1500, "30 ml", "50 mg/ml", "1 mg/ml", 2890),
    (1000, "20 ml", "50 mg/ml", "1 mg/ml", 2090),
    (750, "30 ml", "25 mg/ml", "0.5 mg/ml", 1590),
    (500, "20 ml", "25 mg/ml", "0.5 mg/ml", 1190),
    (250, "10 ml", "25 mg/ml", "0.5 mg/ml", 690),
]


def _producto(orden: int, mg: int, volumen: str, cbd: str, cbg: str, precio: int) -> Producto:
    return Producto(
        slug=f"sinergia-{mg}",
        linea="SINERGIA",
        nombre=f"SINERGIA {mg} mg",
        descripcion=(
            f"Cannabinoides de espectro amplio (Broad Spectrum) con {cbd} de CBD, {cbg} de CBG y terpenos "
            f"naturales. Contenido total de {mg} mg en frasco de {volumen}. Uso veterinario para perros y gatos."
        ),
        mg=mg,
        volumen=volumen,
        concentracion=cbd,
        cbd=cbd,
        cbg=cbg,
        precio=precio,
        estado="publicado",
        destacado=mg == 750,
        orden=orden,
        ficha=[
            ["Contenido total", f"{mg} mg"],
            ["Concentración", cbd],
            ["CBD", cbd],
            ["CBG", cbg],
            ["Volumen", volumen],
            ["Tipo de extracto", "Broad Spectrum"],
            ["Terpenos", TERPENOS],
            ["Uso", "Veterinario · perros y gatos"],
        ],
        fotos=[Foto(archivo=f"sinergia-{mg}-frasco.webp", orden=0), Foto(archivo=f"sinergia-{mg}.webp", orden=1)],
    )


def _copiar_fotos() -> None:
    destino = Path(settings.media_dir)
    destino.mkdir(parents=True, exist_ok=True)
    for foto in AQUI.glob("*.webp"):
        if not (destino / foto.name).exists():
            shutil.copy(foto, destino / foto.name)


async def sembrar() -> bool:
    async with SessionLocal() as db:
        if await db.scalar(select(func.count(Producto.id))):
            return False
        await asyncio.to_thread(_copiar_fotos)
        for i, datos in enumerate(PRESENTACIONES, start=1):
            db.add(_producto(i, *datos))
        for n in range(1, 4):
            db.add(
                Producto(
                    slug=f"proximamente-{n}",
                    nombre="Nueva presentación",
                    descripcion="Muy pronto en la tienda.",
                    estado="proximamente",
                    orden=len(PRESENTACIONES) + n,
                    ficha=[],
                )
            )
        await db.commit()
        return True
