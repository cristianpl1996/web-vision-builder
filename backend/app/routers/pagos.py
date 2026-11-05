"""Webhook de Mercado Pago."""

import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, status

from app.seguridad import Db
from app.services import ajustes, avisos, mercadopago

log = logging.getLogger(__name__)
router = APIRouter(tags=["pagos"])


@router.post("/pagos/webhook/mercadopago")
async def webhook_mercadopago(request: Request, db: Db, tareas: BackgroundTasks):
    """MP avisa «el pago X cambió». Se valida la firma (si hay clave secreta) y el pago se LEE de
    la API de MP: el cuerpo del aviso no se usa como verdad. Responder 200 rápido evita reintentos."""
    params = request.query_params
    try:
        cuerpo = await request.json()
    except ValueError:
        cuerpo = {}
    tipo = params.get("type") or params.get("topic") or cuerpo.get("type") or cuerpo.get("topic")
    data_id = params.get("data.id") or params.get("id") or str((cuerpo.get("data") or {}).get("id") or "")
    if tipo != "payment" or not data_id:
        return {"ok": True}  # otros avisos (merchant_order, etc.) no cambian nada aquí

    a = await ajustes.leer_todos(db)
    if not a["mp_access_token"]:
        raise HTTPException(status.HTTP_409_CONFLICT, "Mercado Pago no está configurado.")
    secreto = a["mp_webhook_secret"]
    if secreto and not mercadopago.firma_valida(
        secreto, request.headers.get("x-signature", ""), request.headers.get("x-request-id", ""), data_id
    ):
        log.warning("Webhook de MP con firma inválida para el pago %s", data_id)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Firma inválida.")

    try:
        pago = await mercadopago.obtener_pago(a["mp_access_token"], data_id)
    except mercadopago.MercadoPagoError:
        log.exception("No se pudo leer el pago %s", data_id)
        # Cualquier respuesta que no sea 2xx hace que MP reintente más tarde.
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "No se pudo leer el pago.") from None
    pagada = await mercadopago.aplicar_pago(db, pago)
    if pagada:
        tareas.add_task(avisos.orden_pagada, pagada)
    return {"ok": True}
