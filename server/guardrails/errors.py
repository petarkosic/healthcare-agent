class GuardrailViolation(Exception):
    """LLM output could not be validated, including after a corrective retry.

    Routers map this to a 502 — the upstream model produced something we refuse
    to hand to a clinician, which is distinct from a 500 (our own failure).
    """

    def __init__(self, context: str, errors: str):
        super().__init__(f"{context}: {errors}")
        self.context = context
        self.errors = errors
