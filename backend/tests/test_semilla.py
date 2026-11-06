from app import sembrar
from tests.conftest import auth


async def _entrar(api, email: str) -> dict:
    r = await api.post("/v1/auth/login", json={"email": email, "password": "Sinergia2026"})
    assert r.status_code == 200, r.text
    return r.json()


async def test_la_semilla_deja_usuarios_catalogo_y_ajustes(api):
    await sembrar.main("Sinergia2026")
    await sembrar.main("Sinergia2026")  # correrla otra vez no duplica nada

    superadmin = await _entrar(api, "superadmin@sinergia.local")
    admin = await _entrar(api, "admin@sinergia.local")
    cliente = await _entrar(api, "cliente@sinergia.local")
    assert [s["user"]["role"] for s in (superadmin, admin, cliente)] == ["superadmin", "admin", "cliente"]

    productos = (await api.get("/v1/admin/productos", headers=auth(admin))).json()
    assert len(productos) == 8
    sinergia = {p["slug"]: p for p in productos}
    assert sinergia["sinergia-1500"]["precio"] == 2890 and len(sinergia["sinergia-1500"]["fotos"]) == 2
    tienda = (await api.get("/v1/tienda")).json()
    assert (tienda["shippingCost"], tienda["freeShippingFrom"], tienda["usdRate"]) == (149, 3000, 18.5)
    assert cliente["user"]["addresses"][0]["postalCode"] == "06700"


async def test_admin_maneja_ordenes_y_productos_pero_no_ajustes(api):
    await sembrar.main("Sinergia2026")
    superadmin = await _entrar(api, "superadmin@sinergia.local")
    admin = await _entrar(api, "admin@sinergia.local")
    cliente = await _entrar(api, "cliente@sinergia.local")
    for ruta in ("/v1/admin/ordenes", "/v1/admin/productos"):
        assert (await api.get(ruta, headers=auth(admin))).status_code == 200
        assert (await api.get(ruta, headers=auth(cliente))).status_code == 403
    assert (await api.get("/v1/admin/ajustes", headers=auth(admin))).status_code == 403
    assert (await api.put("/v1/admin/ajustes", json={"mp_usd": "1"}, headers=auth(admin))).status_code == 403
    assert (await api.get("/v1/admin/ajustes", headers=auth(superadmin))).status_code == 200


async def test_la_semilla_no_pisa_ajustes_guardados(api):
    await sembrar.main("Sinergia2026")
    superadmin = await _entrar(api, "superadmin@sinergia.local")
    # BOTICAN decide envío sin costo y sin dólares: correr la semilla otra vez no lo cambia.
    cambios = {"envio_costo": "0", "tipo_cambio_usd": ""}
    await api.put("/v1/admin/ajustes", json=cambios, headers=auth(superadmin))
    await sembrar.main("Sinergia2026")
    tienda = (await api.get("/v1/tienda")).json()
    assert (tienda["shippingCost"], tienda["usdRate"]) == (0, None)


async def test_en_produccion_la_semilla_no_inventa_ajustes(api):
    await sembrar.main("OtraClave2026", produccion=True)
    tienda = (await api.get("/v1/tienda")).json()
    assert (tienda["shippingCost"], tienda["freeShippingFrom"], tienda["usdRate"]) == (0, None, None)
    # Los usuarios sí quedan, con la contraseña dada.
    r = await api.post("/v1/auth/login", json={"email": "superadmin@sinergia.local", "password": "OtraClave2026"})
    assert r.status_code == 200
