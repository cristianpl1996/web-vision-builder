from tests.conftest import auth, enlace, registrar


async def test_registro_inicia_sesion_y_manda_verificacion(api, correos):
    sesion = await registrar(api, email="Ana@Correo.com")
    assert sesion["user"]["email"] == "ana@correo.com"
    assert sesion["user"]["role"] == "cliente"
    assert sesion["user"]["emailVerified"] is False
    me = await api.get("/v1/me", headers=auth(sesion))
    assert me.status_code == 200
    assert [c["para"] for c in correos] == ["ana@correo.com"]


async def test_correo_repetido_no_crea_otra_cuenta(api, correos):
    await registrar(api)
    r = await api.post(
        "/v1/auth/registro",
        json={"firstName": "Otra", "lastName": "Ana", "email": "ANA@correo.com", "password": "Sinergia2026"},
    )
    assert r.status_code == 409


async def test_contrasena_debil_se_rechaza(api):
    r = await api.post(
        "/v1/auth/registro", json={"firstName": "Ana", "lastName": "Ruiz", "email": "a@b.com", "password": "corta"}
    )
    assert r.status_code == 422


async def test_verificar_correo_con_el_enlace(api, correos):
    sesion = await registrar(api)
    token = enlace(correos[0]["html"], "/verificar")
    r = await api.post("/v1/auth/verificar", json={"token": token})
    assert r.status_code == 200 and r.json()["emailVerified"] is True
    # El enlace de verificación no sirve como sesión.
    assert (await api.get("/v1/me", headers={"Authorization": f"Bearer {token}"})).status_code == 401
    assert (await api.get("/v1/me", headers=auth(sesion))).json()["emailVerified"] is True


async def test_login_y_bloqueo_tras_5_intentos(api, correos):
    await registrar(api)
    malo = {"email": "ana@correo.com", "password": "Equivocada1"}
    for _ in range(5):
        assert (await api.post("/v1/auth/login", json=malo)).status_code == 401
    bueno = {"email": "ana@correo.com", "password": "Sinergia2026"}
    assert (await api.post("/v1/auth/login", json=bueno)).status_code == 429


async def test_login_no_revela_si_el_correo_existe(api):
    r = await api.post("/v1/auth/login", json={"email": "nadie@correo.com", "password": "Sinergia2026"})
    assert r.status_code == 401
    assert r.json()["detail"] == "Correo o contraseña incorrectos."
    assert (await api.post("/v1/auth/olvide", json={"email": "nadie@correo.com"})).status_code == 204


async def test_restablecer_cierra_sesiones_y_el_enlace_sirve_una_vez(api, correos):
    vieja = await registrar(api)
    assert (await api.post("/v1/auth/olvide", json={"email": "ana@correo.com"})).status_code == 204
    token = enlace(correos[-1]["html"], "/restablecer")

    r = await api.post("/v1/auth/restablecer", json={"token": token, "password": "NuevaClave99"})
    assert r.status_code == 200
    nueva = r.json()
    assert (await api.get("/v1/me", headers=auth(vieja))).status_code == 401
    assert (await api.get("/v1/me", headers=auth(nueva))).status_code == 200
    # Segundo uso del mismo enlace: ya no sirve.
    r = await api.post("/v1/auth/restablecer", json={"token": token, "password": "OtraClave99"})
    assert r.status_code == 401
    ok = await api.post("/v1/auth/login", json={"email": "ana@correo.com", "password": "NuevaClave99"})
    assert ok.status_code == 200


async def test_perfil_guarda_direcciones(api, correos):
    from tests.conftest import DIRECCION

    sesion = await registrar(api)
    r = await api.patch("/v1/me", json={"phone": "5598765432", "addresses": [DIRECCION]}, headers=auth(sesion))
    assert r.status_code == 200
    assert r.json()["addresses"][0]["postalCode"] == "06700"


async def test_cliente_no_entra_al_admin(api, correos):
    sesion = await registrar(api)
    for ruta in ("/v1/admin/ordenes", "/v1/admin/productos", "/v1/admin/ajustes"):
        assert (await api.get(ruta, headers=auth(sesion))).status_code == 403
    assert (await api.get("/v1/admin/ordenes")).status_code == 401
