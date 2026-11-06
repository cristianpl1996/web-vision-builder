"""Archivos que suben los usuarios. Se validan por sus primeros bytes, no por la extensión
ni por el content-type que manda el navegador."""

from pathlib import Path

FIRMAS = {b"\xff\xd8\xff": "jpg", b"\x89PNG\r\n\x1a\n": "png"}
TIPOS = {"jpg": "image/jpeg", "png": "image/png", "webp": "image/webp", "pdf": "application/pdf"}


def tipo_imagen(cabeza: bytes) -> str | None:
    if cabeza[:4] == b"RIFF" and cabeza[8:12] == b"WEBP":
        return "webp"
    return next((ext for firma, ext in FIRMAS.items() if cabeza.startswith(firma)), None)


def tipo_comprobante(cabeza: bytes) -> str | None:
    """Foto (JPG, PNG, WebP) o PDF: lo que suele mandar un banco o una captura de pantalla."""
    return "pdf" if cabeza.startswith(b"%PDF-") else tipo_imagen(cabeza)


def guardar(carpeta: str, nombre: str, contenido: bytes) -> None:
    destino = Path(carpeta)
    destino.mkdir(parents=True, exist_ok=True)
    (destino / nombre).write_bytes(contenido)


def borrar(carpeta: str, nombre: str | None) -> None:
    if nombre:
        (Path(carpeta) / nombre).unlink(missing_ok=True)
