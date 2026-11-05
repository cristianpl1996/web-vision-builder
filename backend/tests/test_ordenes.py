from tests.conftest import DIRECCION, auth, crear_producto, registrar


def orden(producto_id: int, cantidad: int = 1, metodo: str = "whatsapp", **extra) -> dict:
    return {
        "items": [{"productId": producto_id, "quantity": cantidad, **extra}],
        "address": DIRECCION,
        "paymentMethod": metodo,
    }


async def test_el_total_lo_decide_el_servidor(api, admin, correos):
    p = await crear_producto(api, admin, precio=1590)
    cliente = await registrar(api)
    # Aunque el navegador mande un precio, se ignora: el servidor usa el de la base.
    r = await api.post("/v1/ordenes", json=orden(p["id"], 2, price=1), headers=auth(cliente))
    assert r.status_code == 201, r.text
    o = r.json()["order"]
    assert (o["subtotal"], o["shipping"], o["total"]) == (3180, 0, 3180)
    assert o["number"] == "SIN-000001" and o["status"] == "pendiente_pago"
    assert o["items"][0]["name"] == "SINERGIA 750 mg"
    # Aviso al cliente (y al correo de avisos, vacío aquí, que no envía nada).
    assert correos[-2]["para"] == "ana@correo.com" or correos[-1]["para"] == "ana@correo.com"


async def test_envio_y_envio_gratis_desde(api, admin, correos):
    await api.put("/v1/admin/ajustes", json={"envio_costo": "149", "envio_gratis_desde": "3000"}, headers=auth(admin))
    p = await crear_producto(api, admin, precio=1590)
    cliente = await registrar(api)
    una = (await api.post("/v1/ordenes", json=orden(p["id"], 1), headers=auth(cliente))).json()["order"]
    assert (una["shipping"], una["total"]) == (149, 1739)
    dos = (await api.post("/v1/ordenes", json=orden(p["id"], 2), headers=auth(cliente))).json()["order"]
    assert (dos["shipping"], dos["total"]) == (0, 3180)


async def test_no_se_compra_lo_no_disponible(api, admin, correos):
    oculto = await crear_producto(api, admin, slug="oculto", estado="oculto")
    sin_precio = await crear_producto(api, admin, slug="sin-precio", precio=None)
    cliente = await registrar(api)
    for p in (oculto, sin_precio):
        assert (await api.post("/v1/ordenes", json=orden(p["id"]), headers=auth(cliente))).status_code == 422
    assert (await api.post("/v1/ordenes", json=orden(99999), headers=auth(cliente))).status_code == 422


async def test_cada_cliente_ve_solo_lo_suyo(api, admin, correos):
    p = await crear_producto(api, admin)
    ana = await registrar(api)
    luis = await registrar(api, email="luis@correo.com")
    o = (await api.post("/v1/ordenes", json=orden(p["id"]), headers=auth(ana))).json()["order"]
    assert (await api.get(f"/v1/ordenes/{o['id']}", headers=auth(luis))).status_code == 404
    assert (await api.get("/v1/ordenes", headers=auth(luis))).json() == []
    assert len((await api.get("/v1/ordenes", headers=auth(ana))).json()) == 1


async def test_estados_y_despacho(api, admin, correos):
    p = await crear_producto(api, admin)
    cliente = await registrar(api)
    o = (await api.post("/v1/ordenes", json=orden(p["id"]), headers=auth(cliente))).json()["order"]
    url = f"/v1/admin/ordenes/{o['id']}/estado"

    # No se puede saltar a entregada desde pendiente.
    assert (await api.patch(url, json={"status": "entregada"}, headers=auth(admin))).status_code == 422
    assert (
        await api.patch(url, json={"status": "pagada", "note": "Transferencia"}, headers=auth(admin))
    ).status_code == 200
    # Enviada exige paquetería y guía.
    assert (await api.patch(url, json={"status": "enviada"}, headers=auth(admin))).status_code == 422
    r = await api.patch(
        url, json={"status": "enviada", "carrier": "Estafeta", "tracking": "EST123"}, headers=auth(admin)
    )
    assert r.status_code == 200
    assert any("va en camino" in c["asunto"] for c in correos)
    r = await api.patch(url, json={"status": "entregada"}, headers=auth(admin))
    assert [e["estado"] for e in r.json()["events"]] == ["pendiente_pago", "pagada", "enviada", "entregada"]
    # Desde entregada ya no se cancela.
    assert (await api.patch(url, json={"status": "cancelada"}, headers=auth(admin))).status_code == 422


async def test_admin_busca_y_filtra(api, admin, correos):
    p = await crear_producto(api, admin)
    ana = await registrar(api)
    luis = await registrar(api, email="luis@correo.com", firstName="Luis")
    await api.post("/v1/ordenes", json=orden(p["id"]), headers=auth(ana))
    o2 = (await api.post("/v1/ordenes", json=orden(p["id"]), headers=auth(luis))).json()["order"]
    await api.patch(f"/v1/admin/ordenes/{o2['id']}/estado", json={"status": "cancelada"}, headers=auth(admin))

    todas = (await api.get("/v1/admin/ordenes", headers=auth(admin))).json()
    assert todas["total"] == 2
    canceladas = (await api.get("/v1/admin/ordenes?estado=cancelada", headers=auth(admin))).json()
    assert [o["number"] for o in canceladas["items"]] == [o2["number"]]
    luis_ordenes = (await api.get("/v1/admin/ordenes?buscar=luis", headers=auth(admin))).json()
    assert luis_ordenes["total"] == 1


async def test_tarjeta_solo_si_mercado_pago_esta_configurado(api, admin, correos):
    p = await crear_producto(api, admin)
    cliente = await registrar(api)
    assert (await api.get("/v1/tienda")).json()["mercadopago"] is False
    r = await api.post("/v1/ordenes", json=orden(p["id"], metodo="mercadopago"), headers=auth(cliente))
    assert r.status_code == 409
