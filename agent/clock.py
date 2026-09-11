from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

TIME_ZONE = "America/Sao_Paulo"

_WEEKDAYS = (
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
    "domingo",
)
_MONTHS = (
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
)


def now_in_secretary_zone() -> datetime:
    """Instante atual no fuso da intranet (America/Sao_Paulo).
    Usa só a base IANA via ZoneInfo (pacote tzdata), sem offset fixo: São Paulo
    está em UTC-3 o ano todo desde 2019, e qualquer horário de verão futuro
    entra pela atualização da base, não por um fallback hardcoded.
    """
    return datetime.now(ZoneInfo(TIME_ZONE))


def format_clock_block(now: datetime | None = None) -> str:
    """Bloco de data e intervalos para o system prompt do turno.
    Calcula agora, hoje, amanhã e a semana (segunda a domingo) no fuso da intranet
    para o modelo montar timeMin/timeMax sem perguntar a data ao usuário.
    @param now instante já no fuso da secretária; se omitido, usa o relógio do servidor.
    """
    instant = now or now_in_secretary_zone()
    today = instant.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    week_start = today - timedelta(days=today.weekday())
    next_week_start = week_start + timedelta(days=7)
    week_after = next_week_start + timedelta(days=7)
    return "\n".join(
        [
            f"Relógio deste turno ({TIME_ZONE}):",
            f"- Agora: {_human_datetime(instant)}",
            f"- ISO: {_iso(instant)}",
            f"- Hoje: timeMin {_iso(today)} / timeMax {_iso(tomorrow)}",
            f"- Amanhã: timeMin {_iso(tomorrow)} / timeMax {_iso(tomorrow + timedelta(days=1))}",
            f"- Esta semana (segunda a domingo): timeMin {_iso(week_start)} / timeMax {_iso(next_week_start)}",
            f"- Próxima semana: timeMin {_iso(next_week_start)} / timeMax {_iso(week_after)}",
            "Se perguntarem a data ou a hora, responda com Agora. Os intervalos são só para timeMin/timeMax da agenda.",
            "Não pergunte a data ao usuário.",
        ]
    )


def _human_datetime(value: datetime) -> str:
    """Data e hora em português, para o modelo ler sem decifrar ISO."""
    weekday = _WEEKDAYS[value.weekday()]
    month = _MONTHS[value.month - 1]
    return f"{weekday}, {value.day} de {month} de {value.year}, {value:%H:%M}"


def _iso(value: datetime) -> str:
    """ISO 8601 com offset, no formato que as tools do Calendar esperam."""
    return value.replace(microsecond=0).isoformat()
