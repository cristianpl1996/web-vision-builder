from fastapi.testclient import TestClient

from app.main import app


def test_health_responde_ok_con_la_base_arriba():
    # Corre contra la base de docker compose (ver «Correr los tests» en CLAUDE.md).
    with TestClient(app) as client:
        r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}
