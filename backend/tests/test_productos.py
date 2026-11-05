from tests.conftest import auth, crear_producto

PNG_1x1 = bytes.fromhex(
    "89504e470d0a1a0a0000000d4948445200000001000000010806000000"
    "1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082"
)


async def test_la_tienda_no_muestra_lo_oculto(api, admin):
    await crear_producto(api, admin, slug="visible", nombre="Visible")
    await crear_producto(api, admin, slug="oculto", nombre="Oculto", estado="oculto")
    await crear_producto(api, admin, slug="pronto", nombre="Pronto", estado="proximamente", precio=None)
    slugs = [p["slug"] for p in (await api.get("/v1/productos")).json()]
    assert slugs == ["visible", "pronto"]
    assert (await api.get("/v1/productos/oculto")).status_code == 404
    todos = (await api.get("/v1/admin/productos", headers=auth(admin))).json()
    assert len(todos) == 3


async def test_editar_duplicar_y_slug_unico(api, admin):
    p = await crear_producto(api, admin)
    r = await api.put(
        f"/v1/admin/productos/{p['id']}",
        json={**{k: p[k] for k in ("slug", "nombre", "mg")}, "precio": 1690},
        headers=auth(admin),
    )
    assert r.status_code == 200 and r.json()["precio"] == 1690
    copia = (await api.post(f"/v1/admin/productos/{p['id']}/duplicar", headers=auth(admin))).json()
    assert copia["estado"] == "oculto" and copia["slug"] != p["slug"]
    r = await api.post("/v1/admin/productos", json={"slug": p["slug"], "nombre": "Otro"}, headers=auth(admin))
    assert r.status_code == 409


async def test_fotos_se_validan_por_contenido(api, admin):
    p = await crear_producto(api, admin)
    falsa = {"archivo": ("foto.png", b"<script>alert(1)</script>", "image/png")}
    r = await api.post(f"/v1/admin/productos/{p['id']}/fotos", files=falsa, headers=auth(admin))
    assert r.status_code == 415

    r = await api.post(
        f"/v1/admin/productos/{p['id']}/fotos", files={"archivo": ("a.png", PNG_1x1, "image/png")}, headers=auth(admin)
    )
    assert r.status_code == 201
    url = r.json()["fotos"][0]["url"]
    servida = await api.get(url)
    assert servida.status_code == 200 and servida.content == PNG_1x1


async def test_ordenar_y_borrar_fotos(api, admin):
    p = await crear_producto(api, admin)
    for _ in range(2):
        await api.post(
            f"/v1/admin/productos/{p['id']}/fotos",
            files={"archivo": ("a.png", PNG_1x1, "image/png")},
            headers=auth(admin),
        )
    fotos = (await api.get("/v1/admin/productos", headers=auth(admin))).json()[0]["fotos"]
    ids = [f["id"] for f in fotos]
    r = await api.put(f"/v1/admin/productos/{p['id']}/fotos/orden", json={"ids": ids[::-1]}, headers=auth(admin))
    assert [f["id"] for f in r.json()["fotos"]] == ids[::-1]
    r = await api.delete(f"/v1/admin/productos/{p['id']}/fotos/{ids[0]}", headers=auth(admin))
    assert [f["id"] for f in r.json()["fotos"]] == [ids[1]]
