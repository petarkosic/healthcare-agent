import json
from pathlib import Path

DATASETS_DIR = Path(__file__).parent


def load_cases(filename: str) -> list[dict]:
    return json.loads((DATASETS_DIR / filename).read_text(encoding="utf-8"))
