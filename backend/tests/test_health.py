async def test_health_responde_ok_con_la_base_arriba(api):
    r = await api.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}
