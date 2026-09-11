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


def zone_info(time_zone: str) -> ZoneInfo:
    """Resolve o fuso IANA; se o nome for inválido, cai no fuso padrão da intranet."""
    try:
        return ZoneInfo(time_zone)
    except Exception:
        return ZoneInfo(TIME_ZONE)


def now_in_zone(time_zone: str) -> datetime:
    """Instante atual no fuso pedido, via ZoneInfo/tzdata."""
    return datetime.now(zone_info(time_zone))


def now_in_secretary_zone() -> datetime:
    """Instante atual no fuso padrão da intranet (America/Sao_Paulo).
    Usado quando ainda não há fuso da agenda Google.
    """
    return now_in_zone(TIME_ZONE)


def format_clock_block(now: datetime | None = None, time_zone: str | None = None) -> str:
    """Bloco de data e intervalos para o system prompt do turno.
    Calcula agora, hoje, amanhã e a semana (segunda a domingo) no fuso informado
    para o modelo montar timeMin/timeMax sem perguntar a data ao usuário.
    @param now instante já no fuso da secretária; se omitido, usa o relógio do servidor.
    @param time_zone IANA da agenda do usuário; se omitido, usa America/Sao_Paulo.
    """
    zone_name = time_zone or TIME_ZONE
    instant = now or now_in_zone(zone_name)
    if instant.tzinfo is None:
        instant = instant.replace(tzinfo=zone_info(zone_name))
    today = instant.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    week_start = today - timedelta(days=today.weekday())
    next_week_start = week_start + timedelta(days=7)
    week_after = next_week_start + timedelta(days=7)
    return "\n".join(
        [
            f"Relógio deste turno ({zone_name}):",
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
