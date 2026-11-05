"""Las tablas de la tienda. Precios en pesos MXN enteros (la tienda no usa centavos)."""

from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def ahora() -> datetime:
    return datetime.now(UTC)


Fecha = DateTime(timezone=True)


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    nombre: Mapped[str] = mapped_column(String(80))
    apellidos: Mapped[str] = mapped_column(String(120))
    telefono: Mapped[str | None] = mapped_column(String(20))
    password_hash: Mapped[str] = mapped_column(String(100))
    rol: Mapped[str] = mapped_column(String(20), default="cliente")  # cliente | superadmin
    email_verificado: Mapped[bool] = mapped_column(Boolean, default=False)
    # Lista de direcciones (máx. 3) con la forma de schemas.Direccion.
    direcciones: Mapped[list] = mapped_column(JSON, default=list)
    # Va dentro de cada JWT; cambiar/restablecer la contraseña la sube y los tokens viejos dejan
    # de servir al instante (un corte por fecha dejaba vivo lo emitido en el mismo segundo).
    version_sesion: Mapped[int] = mapped_column(Integer, default=0)
    intentos_fallidos: Mapped[int] = mapped_column(Integer, default=0)
    bloqueado_hasta: Mapped[datetime | None] = mapped_column(Fecha)
    creado_en: Mapped[datetime] = mapped_column(Fecha, default=ahora)


class Producto(Base):
    """Cada presentación vendible es un producto; `linea` los agrupa (p. ej. «SINERGIA»)."""

    __tablename__ = "productos"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    linea: Mapped[str] = mapped_column(String(80), default="SINERGIA")
    nombre: Mapped[str] = mapped_column(String(160))
    descripcion: Mapped[str] = mapped_column(Text, default="")
    mg: Mapped[int | None] = mapped_column(Integer)
    volumen: Mapped[str] = mapped_column(String(40), default="")
    concentracion: Mapped[str] = mapped_column(String(40), default="")
    cbd: Mapped[str] = mapped_column(String(40), default="")
    cbg: Mapped[str] = mapped_column(String(40), default="")
    precio: Mapped[int | None] = mapped_column(Integer)  # None = «Precio por WhatsApp»
    precio_anterior: Mapped[int | None] = mapped_column(Integer)
    # publicado | oculto | agotado | proximamente
    estado: Mapped[str] = mapped_column(String(20), default="publicado")
    destacado: Mapped[bool] = mapped_column(Boolean, default=False)
    orden: Mapped[int] = mapped_column(Integer, default=0)
    # Ficha técnica: [[clave, valor], ...]
    ficha: Mapped[list] = mapped_column(JSON, default=list)
    creado_en: Mapped[datetime] = mapped_column(Fecha, default=ahora)
    actualizado_en: Mapped[datetime] = mapped_column(Fecha, default=ahora, onupdate=ahora)

    fotos: Mapped[list["Foto"]] = relationship(
        back_populates="producto", cascade="all, delete-orphan", order_by="Foto.orden", lazy="selectin"
    )


class Foto(Base):
    __tablename__ = "fotos"

    id: Mapped[int] = mapped_column(primary_key=True)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id", ondelete="CASCADE"), index=True)
    archivo: Mapped[str] = mapped_column(String(120))
    orden: Mapped[int] = mapped_column(Integer, default=0)
    producto: Mapped[Producto] = relationship(back_populates="fotos")


class Orden(Base):
    __tablename__ = "ordenes"

    id: Mapped[int] = mapped_column(primary_key=True)
    numero: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True)
    email: Mapped[str] = mapped_column(String(254))
    # Copia de la dirección al momento de comprar (no cambia si el cliente edita la suya).
    direccion: Mapped[dict] = mapped_column(JSON)
    notas: Mapped[str] = mapped_column(Text, default="")
    subtotal: Mapped[int] = mapped_column(Integer)
    envio: Mapped[int] = mapped_column(Integer)
    total: Mapped[int] = mapped_column(Integer)
    metodo_pago: Mapped[str] = mapped_column(String(20))  # mercadopago | whatsapp
    estado: Mapped[str] = mapped_column(String(20), default="pendiente_pago", index=True)
    transportista: Mapped[str | None] = mapped_column(String(80))
    guia: Mapped[str | None] = mapped_column(String(80))
    pago_url: Mapped[str | None] = mapped_column(Text)
    creado_en: Mapped[datetime] = mapped_column(Fecha, default=ahora, index=True)
    actualizado_en: Mapped[datetime] = mapped_column(Fecha, default=ahora, onupdate=ahora)

    lineas: Mapped[list["OrdenLinea"]] = relationship(cascade="all, delete-orphan", lazy="selectin")
    eventos: Mapped[list["OrdenEvento"]] = relationship(
        cascade="all, delete-orphan", order_by="OrdenEvento.creado_en", lazy="selectin"
    )
    usuario: Mapped[Usuario] = relationship(lazy="selectin")


class OrdenLinea(Base):
    """Guarda su propia copia de nombre y precio: cambiar o borrar el producto no altera la orden."""

    __tablename__ = "orden_lineas"

    id: Mapped[int] = mapped_column(primary_key=True)
    orden_id: Mapped[int] = mapped_column(ForeignKey("ordenes.id", ondelete="CASCADE"), index=True)
    producto_id: Mapped[int | None] = mapped_column(ForeignKey("productos.id", ondelete="SET NULL"))
    nombre: Mapped[str] = mapped_column(String(160))
    precio: Mapped[int] = mapped_column(Integer)
    cantidad: Mapped[int] = mapped_column(Integer)
    imagen: Mapped[str | None] = mapped_column(String(200))


class OrdenEvento(Base):
    """Historial de la orden: cada cambio de estado, quién y cuándo."""

    __tablename__ = "orden_eventos"

    id: Mapped[int] = mapped_column(primary_key=True)
    orden_id: Mapped[int] = mapped_column(ForeignKey("ordenes.id", ondelete="CASCADE"), index=True)
    estado: Mapped[str] = mapped_column(String(20))
    nota: Mapped[str] = mapped_column(Text, default="")
    por: Mapped[str] = mapped_column(String(40))  # cliente | admin:<email> | mercadopago
    creado_en: Mapped[datetime] = mapped_column(Fecha, default=ahora)


class Pago(Base):
    """Cada pago reportado por la pasarela. El id externo único hace idempotente al webhook."""

    __tablename__ = "pagos"

    id: Mapped[int] = mapped_column(primary_key=True)
    orden_id: Mapped[int] = mapped_column(ForeignKey("ordenes.id", ondelete="CASCADE"), index=True)
    proveedor: Mapped[str] = mapped_column(String(20))
    externo_id: Mapped[str] = mapped_column(String(60), unique=True)
    estado: Mapped[str] = mapped_column(String(30))
    monto: Mapped[float] = mapped_column(Float)  # tal como lo reporta la pasarela
    datos: Mapped[dict] = mapped_column(JSON, default=dict)
    creado_en: Mapped[datetime] = mapped_column(Fecha, default=ahora)
    actualizado_en: Mapped[datetime] = mapped_column(Fecha, default=ahora, onupdate=ahora)


class Ajuste(Base):
    """Configuración editable desde Admin › Ajustes. Los secretos se guardan cifrados."""

    __tablename__ = "ajustes"

    clave: Mapped[str] = mapped_column(String(60), primary_key=True)
    valor: Mapped[str] = mapped_column(Text, default="")
