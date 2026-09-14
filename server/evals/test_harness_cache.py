import json

from evals.harness import cache_or_generate


def test_cache_or_generate_calls_generate_on_first_call(tmp_path, monkeypatch):
    monkeypatch.setattr("evals.harness.FIXTURES_DIR", tmp_path)
    calls = []

    def fake_generate():
        calls.append(1)
        return {"value": 42}

    result = cache_or_generate("overview", {"case_id": "case-a"}, fake_generate)

    assert result == {"value": 42}
    assert len(calls) == 1


def test_cache_or_generate_reuses_fixture_on_second_call(tmp_path, monkeypatch):
    monkeypatch.setattr("evals.harness.FIXTURES_DIR", tmp_path)
    calls = []

    def fake_generate():
        calls.append(1)
        return {"value": 42}

    cache_or_generate("overview", {"case_id": "case-a"}, fake_generate)
    cache_or_generate("overview", {"case_id": "case-a"}, fake_generate)

    assert len(calls) == 1  # second call hit the fixture, didn't regenerate


def test_cache_or_generate_force_live_regenerates(tmp_path, monkeypatch):
    
    monkeypatch.setattr("evals.harness.FIXTURES_DIR", tmp_path)
    calls = []

    def fake_generate():
        calls.append(1)
        return {"value": len(calls)}

    cache_or_generate("overview", {"case_id": "case-a"}, fake_generate)
    cache_or_generate("overview", {"case_id": "case-a"}, fake_generate, force_live=True)

    assert len(calls) == 2


def test_cache_or_generate_writes_readable_json_fixture(tmp_path, monkeypatch):
    monkeypatch.setattr("evals.harness.FIXTURES_DIR", tmp_path)

    cache_or_generate("overview", {"case_id": "case-a"}, lambda: {"value": 42})

    fixture_files = list((tmp_path / "overview").glob("*.json"))
    assert len(fixture_files) == 1
    assert json.loads(fixture_files[0].read_text()) == {"value": 42}
