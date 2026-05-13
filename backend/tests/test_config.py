from app.config import Settings


def test_missing_ai_keys_lists_required_environment_names():
    settings = Settings(deepseek_api_key="", openai_api_key="")

    assert settings.missing_ai_keys() == ["DEEPSEEK_API_KEY", "OPENAI_API_KEY"]


def test_validate_ai_keys_accepts_configured_keys():
    settings = Settings(deepseek_api_key="deepseek-key", openai_api_key="openai-key")

    settings.validate_ai_keys()
