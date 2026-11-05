"""Forma de la entrada y la salida de la API. Los nombres en camelCase de `Direccion`
son los mismos que ya usa el frontend (`frontend/src/services/auth.ts`)."""

import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.config import settings


class Direccion(BaseModel):
    fullName: str = Field(min_length=3, max_length=120)
    phone: str = Field(pattern=r"^\d{10}$")
    street: str = Field(min_length=2, max_length=120)
    extNumber: str = Field(min_length=1, max_length=20)
    intNumber: str | None = Field(default=None, max_length=20)
    neighborhood: str = Field(min_length=2, max_length=120)
    postalCode: str = Field(pattern=r"^\d{5}$")
    city: str = Field(min_length=2, max_length=120)
    state: str = Field(min_length=2, max_length=60)
    references: str | None = Field(default=None, max_length=200)


def _password_valido(v: str) -> str:
    if len(v) < 8 or not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
        raise ValueError("La contraseña debe tener al menos 8 caracteres, con letras y números.")
    return v


class Registro(BaseModel):
    firstName: str = Field(min_length=2, max_length=80)
    lastName: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, pattern=r"^\d{10}$")
    password: str

    _v = field_validator("password")(_password_valido)


class Login(BaseModel):
    # Sin EmailStr: para entrar basta con comparar contra la cuenta (y así no se rechazan
    # dominios internos válidos como el del superadmin de desarrollo).
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(max_length=200)


class Token(BaseModel):
    token: str


class Restablecer(BaseModel):
    token: str
    password: str

    _v = field_validator("password")(_password_valido)


class CambiarPassword(BaseModel):
    actual: str
    nueva: str

    _v = field_validator("nueva")(_password_valido)


class Olvide(BaseModel):
    email: str = Field(min_length=3, max_length=254)


class PerfilCambios(BaseModel):
    firstName: str | None = Field(default=None, min_length=2, max_length=80)
    lastName: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, pattern=r"^\d{10}$")
    addresses: list[Direccion] | None = Field(default=None, max_length=3)


class UsuarioOut(BaseModel):
    id: int
    email: str
    firstName: str
    lastName: str
    phone: str | None
    role: str
    emailVerified: bool
    createdAt: datetime
    addresses: list[Direccion]

    @classmethod
    def de(cls, u) -> "UsuarioOut":
        return cls(
            id=u.id,
            email=u.email,
            firstName=u.nombre,
            lastName=u.apellidos,
            phone=u.telefono,
            role=u.rol,
            emailVerified=u.email_verificado,
            createdAt=u.creado_en,
            addresses=u.direcciones or [],
        )


class Sesion(BaseModel):
    token: str
    user: UsuarioOut


# ── Productos ───────────────────────────────────────────────────────────────

EstadoProducto = Literal["publicado", "oculto", "agotado", "proximamente"]


def url_media(archivo: str | None) -> str | None:
    return f"/v1/media/{archivo}" if archivo else None


class FotoOut(BaseModel):
    id: int
    url: str


class ProductoOut(BaseModel):
    id: int
    slug: str
    linea: str
    nombre: str
    descripcion: str
    mg: int | None
    volumen: str
    concentracion: str
    cbd: str
    cbg: str
    precio: int | None
    precio_anterior: int | None
    estado: EstadoProducto
    destacado: bool
    orden: int
    ficha: list[list[str]]
    fotos: list[FotoOut]

    @classmethod
    def de(cls, p) -> "ProductoOut":
        return cls(
            **{k: getattr(p, k) for k in cls.model_fields if k != "fotos"},
            fotos=[FotoOut(id=f.id, url=url_media(f.archivo)) for f in p.fotos],
        )


class ProductoIn(BaseModel):
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=120)
    linea: str = Field(default="SINERGIA", min_length=1, max_length=80)
    nombre: str = Field(min_length=2, max_length=160)
    descripcion: str = Field(default="", max_length=4000)
    mg: int | None = Field(default=None, ge=0)
    volumen: str = Field(default="", max_length=40)
    concentracion: str = Field(default="", max_length=40)
    cbd: str = Field(default="", max_length=40)
    cbg: str = Field(default="", max_length=40)
    precio: int | None = Field(default=None, ge=0, le=1_000_000)
    precio_anterior: int | None = Field(default=None, ge=0, le=1_000_000)
    estado: EstadoProducto = "publicado"
    destacado: bool = False
    orden: int = 0
    ficha: list[list[str]] = Field(default_factory=list, max_length=30)


class OrdenFotos(BaseModel):
    ids: list[int]


# ── Órdenes ─────────────────────────────────────────────────────────────────

MetodoPago = Literal["mercadopago", "whatsapp"]


class ItemIn(BaseModel):
    productId: int
    quantity: int = Field(ge=1, le=20)


class OrdenIn(BaseModel):
    items: list[ItemIn] = Field(min_length=1, max_length=30)
    address: Direccion
    paymentMethod: MetodoPago
    notes: str = Field(default="", max_length=500)


class LineaOut(BaseModel):
    productId: int | None
    name: str
    price: int
    quantity: int
    image: str | None


class EventoOut(BaseModel):
    estado: str
    nota: str
    por: str
    fecha: datetime


class OrdenOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    number: str
    email: str
    items: list[LineaOut]
    subtotal: int
    shipping: int
    total: int
    address: Direccion
    paymentMethod: str
    status: str
    carrier: str | None
    tracking: str | None
    paymentUrl: str | None
    notes: str
    events: list[EventoOut]
    createdAt: datetime
    customerName: str

    @classmethod
    def de(cls, o) -> "OrdenOut":
        return cls(
            id=o.id,
            number=o.numero,
            email=o.email,
            items=[
                LineaOut(
                    productId=lin.producto_id,
                    name=lin.nombre,
                    price=lin.precio,
                    quantity=lin.cantidad,
                    image=url_media(lin.imagen),
                )
                for lin in o.lineas
            ],
            subtotal=o.subtotal,
            shipping=o.envio,
            total=o.total,
            address=o.direccion,
            paymentMethod=o.metodo_pago,
            status=o.estado,
            carrier=o.transportista,
            tracking=o.guia,
            paymentUrl=o.pago_url if o.estado == "pendiente_pago" else None,
            notes=o.notas,
            events=[EventoOut(estado=e.estado, nota=e.nota, por=e.por, fecha=e.creado_en) for e in o.eventos],
            createdAt=o.creado_en,
            customerName=f"{o.usuario.nombre} {o.usuario.apellidos}" if o.usuario else "",
        )


class OrdenCreada(BaseModel):
    order: OrdenOut
    paymentUrl: str | None


class CambioEstado(BaseModel):
    status: Literal["pendiente_pago", "pagada", "preparando", "enviada", "entregada", "cancelada"]
    note: str = Field(default="", max_length=500)
    carrier: str | None = Field(default=None, max_length=80)
    tracking: str | None = Field(default=None, max_length=80)


class PaginaOrdenes(BaseModel):
    items: list[OrdenOut]
    total: int


class TiendaConfig(BaseModel):
    mercadopago: bool
    shippingCost: int
    freeShippingFrom: int | None
    appUrl: str = settings.app_url
