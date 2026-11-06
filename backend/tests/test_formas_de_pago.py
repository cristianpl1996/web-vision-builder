"""Las dos formas de pago: Mercado Pago (pasarela) y transferencia con comprobante.
Se pueden encender y apagar en Ajustes, pero siempre queda al menos una."""

from pathlib import Path

from app.config import settings
from tests.conftest import auth, crear_producto, registrar
from tests.test_ordenes import orden
from tests.test_pagos import mp  # noqa: F401 — fixture de Mercado Pago simulado

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
PDF = b"%PDF-1.7\n" + b"0" * 64


def _guardados(orden_id: int) -> set[str]:
    """Los archivos de comprobante que hay en disco para esa orden."""
    return {f.name for f in Path(settings.comprobantes_dir).glob(f"SIN-{orden_id:06d}-*")}


async def _subir(api, sesion, oid, contenido=PNG, nombre="comprobante.png"):
    return await api.post(
        f"/v1/ordenes/{oid}/comprobante", files={"archivo": (nombre, contenido)}, headers=auth(sesion)
    )


async def test_transferencia_con_comprobante(api, admin, correos):
    await api.put("/v1/admin/ajustes", json={"correo_avisos": "pedidos@botican.mx"}, headers=auth(admin))
    p = await crear_producto(api, admin)
    ana = await registrar(api)
    luis = await registrar(api, email="luis@correo.com")
    o = (await api.post("/v1/ordenes", json=orden(p["id"]), headers=auth(ana))).json()["order"]
    assert (o["paymentMethod"], o["hasReceipt"]) == ("transferencia", False)

    # Solo fotos o PDF, validados por su contenido.
    assert (await _subir(api, ana, o["id"], b"hola, no soy imagen", "x.png")).status_code == 415
    # Nadie más puede subir ni ver el comprobante de Ana.
    assert (await _subir(api, luis, o["id"])).status_code == 404

    r = await _subir(api, ana, o["id"], PDF, "comprobante.pdf")
    assert r.status_code == 200, r.text
    assert r.json()["hasReceipt"] and r.json()["events"][-1]["nota"] == "Comprobante de pago enviado"
    assert any(c["para"] == "pedidos@botican.mx" and "Comprobante" in c["asunto"] for c in correos)

    mio = await api.get(f"/v1/ordenes/{o['id']}/comprobante", headers=auth(ana))
    assert mio.status_code == 200 and mio.headers["content-type"] == "application/pdf"
    assert (await api.get(f"/v1/ordenes/{o['id']}/comprobante", headers=auth(luis))).status_code == 404
    panel = await api.get(f"/v1/admin/ordenes/{o['id']}/comprobante", headers=auth(admin))
    assert panel.status_code == 200 and panel.content == PDF
    # No es público: no está bajo /v1/media.
    assert (await api.get(f"/v1/admin/ordenes/{o['id']}/comprobante", headers=auth(luis))).status_code == 403

    # El panel lo revisa y marca pagada; ya no se puede subir otro.
    url = f"/v1/admin/ordenes/{o['id']}/estado"
    assert (await api.patch(url, json={"status": "pagada"}, headers=auth(admin))).status_code == 200
    assert (await _subir(api, ana, o["id"])).status_code == 409


async def test_siempre_queda_una_forma_de_pago(api, admin, correos):
    # Sin Mercado Pago configurado, la transferencia no se puede apagar.
    r = await api.put("/v1/admin/ajustes", json={"pago_transferencia": ""}, headers=auth(admin))
    assert r.status_code == 422
    tienda = (await api.get("/v1/tienda")).json()
    assert (tienda["mercadopago"], tienda["transferencia"]) == (False, True)


async def test_solo_pasarela_o_solo_transferencia(api, admin, mp, correos):  # noqa: F811
    p = await crear_producto(api, admin)
    cliente = await registrar(api)
    datos = {"pago_transferencia": "", "tipo_cambio_usd": "18.5", "transferencia_datos": "BBVA · CLABE 0123"}
    # Solo pasarela: la transferencia se rechaza y, como MP no cobra en dólares, no se ofrecen dólares.
    assert (await api.put("/v1/admin/ajustes", json=datos, headers=auth(admin))).status_code == 200
    tienda = (await api.get("/v1/tienda")).json()
    assert (tienda["mercadopago"], tienda["transferencia"], tienda["usdRate"], tienda["transferInfo"]) == (
        True,
        False,
        None,
        "",
    )
    assert (await api.post("/v1/ordenes", json=orden(p["id"]), headers=auth(cliente))).status_code == 409
    con_mp = (await api.post("/v1/ordenes", json=orden(p["id"], metodo="mercadopago"), headers=auth(cliente))).json()
    assert (await _subir(api, cliente, con_mp["order"]["id"])).status_code == 409

    # Solo transferencia: Mercado Pago apagado aunque tenga credenciales.
    cambio = {"pago_transferencia": "1", "pago_mercadopago": ""}
    assert (await api.put("/v1/admin/ajustes", json=cambio, headers=auth(admin))).status_code == 200
    tienda = (await api.get("/v1/tienda")).json()
    assert (tienda["mercadopago"], tienda["transferencia"], tienda["transferInfo"]) == (
        False,
        True,
        "BBVA · CLABE 0123",
    )
    r = await api.post("/v1/ordenes", json=orden(p["id"], metodo="mercadopago"), headers=auth(cliente))
    assert r.status_code == 409
    # Un pedido que iba con Mercado Pago puede pagarse por transferencia subiendo el comprobante.
    r = await _subir(api, cliente, con_mp["order"]["id"])
    assert r.status_code == 200 and r.json()["paymentMethod"] == "transferencia"


async def test_cambiar_el_comprobante_borra_el_anterior(api, admin, correos):
    p = await crear_producto(api, admin)
    ana = await registrar(api)
    o = (await api.post("/v1/ordenes", json=orden(p["id"]), headers=auth(ana))).json()["order"]
    # Sin comprobante todavía: no hay nada que ver.
    assert (await api.get(f"/v1/ordenes/{o['id']}/comprobante", headers=auth(ana))).status_code == 404
    # Los ids se reinician entre pruebas: se cuentan solo los archivos nuevos de esta prueba.
    antes = _guardados(o["id"])
    await _subir(api, ana, o["id"], PNG, "uno.png")
    primero = _guardados(o["id"]) - antes
    assert len(primero) == 1
    await _subir(api, ana, o["id"], PDF, "dos.pdf")
    segundo = _guardados(o["id"]) - antes
    assert len(segundo) == 1 and segundo != primero and next(iter(segundo)).endswith(".pdf")


async def test_el_correo_del_pedido_explica_como_pagar(api, admin, correos):
    p = await crear_producto(api, admin)
    ana = await registrar(api)
    o = (await api.post("/v1/ordenes", json=orden(p["id"]), headers=auth(ana))).json()["order"]
    recibido = next(c for c in correos if c["para"] == "ana@correo.com" and c["asunto"].startswith("Recibimos"))
    assert "sube tu comprobante" in recibido["html"] and f"/pedido/{o['id']}" in recibido["html"]


async def test_el_admin_tambien_revisa_comprobantes(api, admin, correos):
    from tests.conftest import SessionLocal, modelos, text

    p = await crear_producto(api, admin)
    ana = await registrar(api)
    o = (await api.post("/v1/ordenes", json=orden(p["id"]), headers=auth(ana))).json()["order"]
    await _subir(api, ana, o["id"])
    operador = await registrar(api, email="operador@botican.mx")
    async with SessionLocal() as db:
        uid = (await db.execute(text("select id from usuarios where email = 'operador@botican.mx'"))).scalar_one()
        (await db.get(modelos.Usuario, uid)).rol = "admin"
        await db.commit()
    r = await api.get(f"/v1/admin/ordenes/{o['id']}/comprobante", headers=auth(operador))
    assert r.status_code == 200 and r.content == PNG
