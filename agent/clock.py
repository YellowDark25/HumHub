from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

TIME_ZONE = "America/Sao_Paulo"
_UTC_MINUS_3 = timezone(timedelta(hours=-3), name=TIME_ZONE)

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
    Tenta ZoneInfo; se o fuso não estiver no sistema, usa UTC-3, o horário oficial vigente.
    """
    try:
        return datetime.now(ZoneInfo(TIME_ZONE))
    except Exception:
        return datetime.now(_UTC_MINUS_3)


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
            "Use estes intervalos para hoje, amanhã e esta semana. Não pergunte a data ao usuário.",
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
