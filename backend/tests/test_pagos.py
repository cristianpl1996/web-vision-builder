import hashlib
import hmac

import pytest

from app.services import mercadopago
from tests.conftest import auth, crear_producto, registrar
from tests.test_ordenes import orden

SECRETO = "clave-webhook-de-prueba"


@pytest.fixture
async def mp(api, admin, monkeypatch):
    """Mercado Pago configurado y con la API de MP simulada."""
    await api.put(
        "/v1/admin/ajustes",
        json={"mp_access_token": "TEST-123", "mp_public_key": "TEST-pk", "mp_webhook_secret": SECRETO},
        headers=auth(admin),
    )
    pagos: dict[str, dict] = {}

    async def preferencia(token, o):
        return f"https://mp.test/checkout/{o.id}"

    async def obtener(token, pago_id):
        return pagos[pago_id]

    async def buscar(token, orden_id):
        return [p for p in pagos.values() if p["external_reference"] == str(orden_id)]

    monkeypatch.setattr(mercadopago, "crear_preferencia", preferencia)
    monkeypatch.setattr(mercadopago, "obtener_pago", obtener)
    monkeypatch.setattr(mercadopago, "buscar_pagos_de_orden", buscar)
    return pagos


def firmar(data_id: str, request_id: str = "req-1", ts: str = "1700000000") -> dict:
    manifiesto = f"id:{data_id};request-id:{request_id};ts:{ts};"
    v1 = hmac.new(SECRETO.encode(), manifiesto.encode(), hashlib.sha256).hexdigest()
    return {"x-signature": f"ts={ts},v1={v1}", "x-request-id": request_id}


async def _orden_mp(api, admin, precio=1590):
    p = await crear_producto(api, admin, precio=precio)
    cliente = await registrar(api)
    r = await api.post("/v1/ordenes", json=orden(p["id"], metodo="mercadopago"), headers=auth(cliente))
    assert r.status_code == 201, r.text
    return cliente, r.json()


async def test_orden_con_tarjeta_devuelve_el_checkout(api, admin, mp, correos):
    _, creada = await _orden_mp(api, admin)
    assert creada["paymentUrl"] == f"https://mp.test/checkout/{creada['order']['id']}"
    assert (await api.get("/v1/tienda")).json()["mercadopago"] is True


async def test_webhook_firmado_marca_pagada_una_sola_vez(api, admin, mp, correos):
    cliente, creada = await _orden_mp(api, admin)
    oid = creada["order"]["id"]
    mp["555"] = {
        "id": 555,
        "status": "approved",
        "external_reference": str(oid),
        "transaction_amount": 1590,
        "currency_id": "MXN",
    }
    url = "/v1/pagos/webhook/mercadopago?type=payment&data.id=555"
    assert (
        await api.post(url, json={"type": "payment", "data": {"id": "555"}}, headers=firmar("555"))
    ).status_code == 200
    # MP reintenta el mismo aviso: no duplica el pago ni el correo.
    assert (await api.post(url, json={}, headers=firmar("555"))).status_code == 200
    o = (await api.get(f"/v1/ordenes/{oid}", headers=auth(cliente))).json()
    assert o["status"] == "pagada"
    assert sum("Pago confirmado" in c["asunto"] for c in correos) == 1


async def test_webhook_con_firma_falsa_se_rechaza(api, admin, mp, correos):
    _, creada = await _orden_mp(api, admin)
    mp["9"] = {
        "id": 9,
        "status": "approved",
        "external_reference": str(creada["order"]["id"]),
        "transaction_amount": 1590,
        "currency_id": "MXN",
    }
    falsa = {"x-signature": "ts=1,v1=deadbeef", "x-request-id": "x"}
    r = await api.post("/v1/pagos/webhook/mercadopago?type=payment&data.id=9", json={}, headers=falsa)
    assert r.status_code == 401


async def test_monto_distinto_no_marca_pagada(api, admin, mp, correos):
    cliente, creada = await _orden_mp(api, admin)
    oid = creada["order"]["id"]
    mp["7"] = {
        "id": 7,
        "status": "approved",
        "external_reference": str(oid),
        "transaction_amount": 1,
        "currency_id": "MXN",
    }
    await api.post("/v1/pagos/webhook/mercadopago?type=payment&data.id=7", json={}, headers=firmar("7"))
    o = (await api.get(f"/v1/ordenes/{oid}", headers=auth(cliente))).json()
    assert o["status"] == "pendiente_pago"
    assert "no coincide" in o["events"][-1]["nota"]


async def test_al_volver_se_verifica_contra_mercado_pago(api, admin, mp, correos):
    cliente, creada = await _orden_mp(api, admin)
    oid = creada["order"]["id"]
    # Sin pago en MP: sigue pendiente aunque la URL diga «aprobado».
    r = await api.post(f"/v1/ordenes/{oid}/verificar-pago", headers=auth(cliente))
    assert r.json()["status"] == "pendiente_pago"
    mp["8"] = {
        "id": 8,
        "status": "approved",
        "external_reference": str(oid),
        "transaction_amount": 1590,
        "currency_id": "MXN",
    }
    r = await api.post(f"/v1/ordenes/{oid}/verificar-pago", headers=auth(cliente))
    assert r.json()["status"] == "pagada"


def test_firma_valida_segun_la_documentacion_de_mp():
    assert mercadopago.firma_valida(SECRETO, firmar("abc")["x-signature"], "req-1", "ABC")
    assert not mercadopago.firma_valida(SECRETO, "ts=1700000000,v1=00", "req-1", "abc")
    assert not mercadopago.firma_valida(SECRETO, "", "req-1", "abc")
