GOOGLE_CONNECT_HREF = "/configuracoes?secao=integracoes"

SECRETARY_SYSTEM_PROMPT = """Você é a Secretária da intranet NexHub.
Fala em português do Brasil, de forma curta e objetiva.
Controla a agenda e as tarefas do usuário no Google Calendar e no Google Tasks.
Quando faltar horário, duração ou título, pergunte antes de criar.
Confirme o que fez depois de cada alteração.
Não invente eventos ou tarefas que as tools não devolveram.
Fuso horário padrão: America/Sao_Paulo.
Quando o usuário afirmar uma preferência estável (duração padrão de reunião, horário de trabalho, como nomear tarefas, forma de tratamento), grave com lembrar_preferencia.
Se pedir para esquecer, use esquecer_preferencia.
Não grave recados pontuais — um evento ou tarefa de uma data — como preferência.
Use o resumo da conversa e as preferências já gravadas; não peça de novo o que já está lá.
Várias mensagens seguidas do usuário, sem resposta sua no meio, são o mesmo recado — junte o sentido e responda uma vez."""

SECRETARY_NOT_CONNECTED = (
    f"Ainda não conectei sua conta Google. Abra {GOOGLE_CONNECT_HREF} em "
    "Configurações → Integrações e autorize o Calendar e as Tarefas. "
    "Depois me chame de novo."
)


def secretary_tool_definitions() -> list[dict]:
    """Tools de Calendar, Tasks e preferências que o modelo pode chamar neste corte."""
    return [
        {
            "name": "list_events",
            "description": "Lista eventos da agenda no intervalo pedido.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "timeMin": {
                        "type": "string",
                        "description": "Início do intervalo em ISO 8601.",
                    },
                    "timeMax": {
                        "type": "string",
                        "description": "Fim do intervalo em ISO 8601.",
                    },
                },
                "required": ["timeMin", "timeMax"],
            },
        },
        {
            "name": "create_event",
            "description": "Cria um evento na agenda.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "start": {"type": "string", "description": "Início em ISO 8601."},
                    "end": {"type": "string", "description": "Fim em ISO 8601."},
                    "description": {"type": "string"},
                },
                "required": ["title", "start", "end"],
            },
        },
        {
            "name": "update_event",
            "description": "Altera um evento já existente.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "eventId": {"type": "string"},
                    "title": {"type": "string"},
                    "start": {"type": "string"},
                    "end": {"type": "string"},
                    "description": {"type": "string"},
                },
                "required": ["eventId"],
            },
        },
        {
            "name": "list_tasks",
            "description": "Lista as tarefas abertas do Google Tasks.",
            "input_schema": {"type": "object", "properties": {}},
        },
        {
            "name": "create_task",
            "description": "Cria uma tarefa.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "notes": {"type": "string"},
                    "due": {"type": "string", "description": "Prazo em ISO 8601."},
                },
                "required": ["title"],
            },
        },
        {
            "name": "complete_task",
            "description": "Marca uma tarefa como concluída.",
            "input_schema": {
                "type": "object",
                "properties": {"taskId": {"type": "string"}},
                "required": ["taskId"],
            },
        },
        {
            "name": "lembrar_preferencia",
            "description": (
                "Grava uma preferência estável do usuário para os próximos turnos. "
                "Use chave curta em slug (ex. duracao_reuniao, horario_trabalho)."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "chave": {
                        "type": "string",
                        "description": "Identificador curto da preferência.",
                    },
                    "valor": {
                        "type": "string",
                        "description": "O que deve ser lembrado.",
                    },
                },
                "required": ["chave", "valor"],
            },
        },
        {
            "name": "esquecer_preferencia",
            "description": "Apaga uma preferência gravada pela chave.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "chave": {
                        "type": "string",
                        "description": "Identificador da preferência a esquecer.",
                    },
                },
                "required": ["chave"],
            },
        },
    ]
