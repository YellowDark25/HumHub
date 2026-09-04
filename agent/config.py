import os


def _read(name: str) -> str:
    """Lê variável de ambiente sem espaços nas pontas."""
    return os.environ.get(name, "").strip()


def humhub_url() -> str:
    """URL do HumHub usada no cano da secretária (reply, histórico, Google)."""
    url = _read("HUMHUB_URL") or "http://localhost:8090"
    return url.rstrip("/")


def service_secret() -> str:
    """Segredo compartilhado com o HumHub. Local usa o valor padrão do compose."""
    secret = _read("KAIZZEN_SERVICE_SECRET")
    if secret:
        return secret
    if _read("NODE_ENV") == "production" or _read("RAILWAY_ENVIRONMENT"):
        return ""
    return "kaizzen-local-service-secret"


def anthropic_api_key() -> str:
    """Chave da Anthropic. Vazia quando o turno só ecoa o recado."""
    return _read("ANTHROPIC_API_KEY")


def google_client_id() -> str:
    """Client id OAuth do Google, para renovar o access token."""
    return _read("GOOGLE_CLIENT_ID")


def google_client_secret() -> str:
    """Client secret OAuth do Google."""
    return _read("GOOGLE_CLIENT_SECRET")


def gemini_api_key() -> str:
    """Chave do Gemini usada na transcrição de áudio."""
    return _read("GEMINI_API_KEY")


def openai_api_key() -> str:
    """Chave da OpenAI, fallback do Whisper se não houver Gemini."""
    return _read("OPENAI_API_KEY")
