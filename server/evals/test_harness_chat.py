from evals.harness import generate_chat_answer_case


def test_generate_chat_answer_case_returns_chat_answer_shape():
    case = {
        "case_id": "chat-004-no-trend-medications",
        "patient_email": "priya.sharma@gmail.com",
        "message": "What's the current medication list?",
    }

    result = generate_chat_answer_case(case, force_live=False)

    assert "answer" in result
    assert "chart_data" in result
    assert "tool_calls" in result
