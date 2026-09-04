class AgentError(Exception):
    """Erro de negócio do agente, com status HTTP para o log e o chat."""

    def __init__(self, message: str, status: int = 500) -> None:
        super().__init__(message)
        self.status = status
