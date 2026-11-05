"""Catálogo: lo que ve la tienda y lo que administra el superadmin (incluidas las fotos)."""

import asyncio
import secrets
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app import schemas
from app.config import settings
from app.modelos import Foto, Producto
from app.seguridad import Admin, Db

router = APIRouter(tags=["productos"])

VISIBLES = ("publicado", "agotado", "proximamente")
MAX_FOTO = 5 * 1024 * 1024
# Se valida por los primeros bytes, no por la extensión ni el content-type que manda el navegador.
FIRMAS = {b"\xff\xd8\xff": "jpg", b"\x89PNG\r\n\x1a\n": "png"}


def _tipo_imagen(cabeza: bytes) -> str | None:
    if cabeza[:4] == b"RIFF" and cabeza[8:12] == b"WEBP":
        return "webp"
    return next((ext for firma, ext in FIRMAS.items() if cabeza.startswith(firma)), None)


def _guardar(nombre: str, contenido: bytes) -> None:
    destino = Path(settings.media_dir)
    destino.mkdir(parents=True, exist_ok=True)
    (destino / nombre).write_bytes(contenido)


async def _producto(db, producto_id: int) -> Producto:
    p = await db.get(Producto, producto_id)
    if p is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Producto no encontrado.")
    return p


# ── Tienda ──────────────────────────────────────────────────────────────────


@router.get("/productos", response_model=list[schemas.ProductoOut])
async def catalogo(db: Db):
    q = select(Producto).where(Producto.estado.in_(VISIBLES)).order_by(Producto.orden, Producto.id)
    return [schemas.ProductoOut.de(p) for p in (await db.scalars(q)).all()]


@router.get("/productos/{slug}", response_model=schemas.ProductoOut)
async def detalle(slug: str, db: Db):
    p = await db.scalar(select(Producto).where(Producto.slug == slug, Producto.estado.in_(VISIBLES)))
    if p is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Producto no encontrado.")
    return schemas.ProductoOut.de(p)


# ── Administración ──────────────────────────────────────────────────────────


@router.get("/admin/productos", response_model=list[schemas.ProductoOut])
async def admin_listar(_: Admin, db: Db):
    q = select(Producto).order_by(Producto.orden, Producto.id)
    return [schemas.ProductoOut.de(p) for p in (await db.scalars(q)).all()]


@router.post("/admin/productos", response_model=schemas.ProductoOut, status_code=201)
async def admin_crear(datos: schemas.ProductoIn, _: Admin, db: Db):
    p = Producto(**datos.model_dump())
    db.add(p)
    try:
        await db.commit()
    except IntegrityError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un producto con esa dirección (slug).") from None
    await db.refresh(p, ["fotos"])
    return schemas.ProductoOut.de(p)


@router.put("/admin/productos/{producto_id}", response_model=schemas.ProductoOut)
async def admin_editar(producto_id: int, datos: schemas.ProductoIn, _: Admin, db: Db):
    p = await _producto(db, producto_id)
    for campo, valor in datos.model_dump().items():
        setattr(p, campo, valor)
    try:
        await db.commit()
    except IntegrityError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un producto con esa dirección (slug).") from None
    await db.refresh(p, ["fotos"])
    return schemas.ProductoOut.de(p)


@router.post("/admin/productos/{producto_id}/duplicar", response_model=schemas.ProductoOut, status_code=201)
async def admin_duplicar(producto_id: int, _: Admin, db: Db):
    p = await _producto(db, producto_id)
    datos = schemas.ProductoIn.model_validate(p, from_attributes=True).model_dump()
    datos.update(slug=f"{p.slug}-copia-{secrets.token_hex(2)}", nombre=f"{p.nombre} (copia)", estado="oculto")
    copia = Producto(**datos, fotos=[Foto(archivo=f.archivo, orden=f.orden) for f in p.fotos])
    db.add(copia)
    await db.commit()
    await db.refresh(copia, ["fotos"])
    return schemas.ProductoOut.de(copia)


@router.delete("/admin/productos/{producto_id}", status_code=204)
async def admin_borrar(producto_id: int, _: Admin, db: Db):
    """Las órdenes guardan su copia de nombre y precio: borrar no altera compras pasadas."""
    await db.delete(await _producto(db, producto_id))
    await db.commit()


@router.post("/admin/productos/{producto_id}/fotos", response_model=schemas.ProductoOut, status_code=201)
async def admin_subir_foto(producto_id: int, archivo: UploadFile, _: Admin, db: Db):
    p = await _producto(db, producto_id)
    contenido = await archivo.read(MAX_FOTO + 1)
    if len(contenido) > MAX_FOTO:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "La foto pesa más de 5 MB.")
    ext = _tipo_imagen(contenido[:16])
    if ext is None:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Sube una foto JPG, PNG o WebP.")
    nombre = f"{secrets.token_hex(12)}.{ext}"
    await asyncio.to_thread(_guardar, nombre, contenido)
    p.fotos.append(Foto(archivo=nombre, orden=len(p.fotos)))
    await db.commit()
    await db.refresh(p, ["fotos"])
    return schemas.ProductoOut.de(p)


@router.put("/admin/productos/{producto_id}/fotos/orden", response_model=schemas.ProductoOut)
async def admin_ordenar_fotos(producto_id: int, datos: schemas.OrdenFotos, _: Admin, db: Db):
    """La primera es la principal (la que se ve en la tienda)."""
    p = await _producto(db, producto_id)
    posicion = {foto_id: i for i, foto_id in enumerate(datos.ids)}
    for f in p.fotos:
        f.orden = posicion.get(f.id, len(posicion) + f.orden)
    await db.commit()
    await db.refresh(p, ["fotos"])
    return schemas.ProductoOut.de(p)


@router.delete("/admin/productos/{producto_id}/fotos/{foto_id}", response_model=schemas.ProductoOut)
async def admin_borrar_foto(producto_id: int, foto_id: int, _: Admin, db: Db):
    p = await _producto(db, producto_id)
    foto = next((f for f in p.fotos if f.id == foto_id), None)
    if foto is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Foto no encontrada.")
    p.fotos.remove(foto)
    await db.commit()
    await db.refresh(p, ["fotos"])
    return schemas.ProductoOut.de(p)
