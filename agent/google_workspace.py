from typing import Any

import httpx

from config import google_client_id, google_client_secret
from errors import AgentError

CALENDAR_URL = "https://www.googleapis.com/calendar/v3/calendars/primary"
TASKS_LISTS_URL = "https://tasks.googleapis.com/tasks/v1/users/@me/lists"
TIME_ZONE = "America/Sao_Paulo"


async def list_events(http: httpx.AsyncClient, refresh_token: str, time_min: str, time_max: str) -> list[dict[str, str]]:
    """Eventos no intervalo [time_min, time_max] do calendário principal."""
    access = await _access_token(http, refresh_token)
    data = await _google_json(
        http,
        f"{CALENDAR_URL}/events",
        access,
        params={
            "timeMin": time_min,
            "timeMax": time_max,
            "singleEvents": "true",
            "orderBy": "startTime",
        },
    )
    return [_map_event(item) for item in data.get("items") or []]


async def create_event(
    http: httpx.AsyncClient,
    refresh_token: str,
    title: str,
    start: str,
    end: str,
    description: str | None,
) -> dict[str, str]:
    """Cria um evento no calendário principal."""
    access = await _access_token(http, refresh_token)
    created = await _google_json(
        http,
        f"{CALENDAR_URL}/events",
        access,
        method="POST",
        body={
            "summary": title,
            "description": description or "",
            "start": _date_field(start),
            "end": _date_field(end),
        },
    )
    return _map_event(created)


async def update_event(
    http: httpx.AsyncClient,
    refresh_token: str,
    event_id: str,
    title: str | None,
    start: str | None,
    end: str | None,
    description: str | None,
) -> dict[str, str]:
    """Altera título, horário ou descrição de um evento."""
    access = await _access_token(http, refresh_token)
    body: dict[str, Any] = {}
    if title:
        body["summary"] = title
    if description is not None:
        body["description"] = description
    if start:
        body["start"] = _date_field(start)
    if end:
        body["end"] = _date_field(end)
    updated = await _google_json(
        http,
        f"{CALENDAR_URL}/events/{event_id}",
        access,
        method="PATCH",
        body=body,
    )
    return _map_event(updated)


async def list_tasks(http: httpx.AsyncClient, refresh_token: str) -> list[dict[str, Any]]:
    """Tarefas da lista padrão que ainda não foram concluídas."""
    access = await _access_token(http, refresh_token)
    list_id = await _default_task_list_id(http, access)
    data = await _google_json(
        http,
        f"https://tasks.googleapis.com/tasks/v1/lists/{list_id}/tasks",
        access,
        params={"showCompleted": "false"},
    )
    return [_map_task(item) for item in data.get("items") or []]


async def create_task(
    http: httpx.AsyncClient,
    refresh_token: str,
    title: str,
    notes: str | None,
    due: str | None,
) -> dict[str, Any]:
    """Cria uma tarefa na lista padrão."""
    access = await _access_token(http, refresh_token)
    list_id = await _default_task_list_id(http, access)
    created = await _google_json(
        http,
        f"https://tasks.googleapis.com/tasks/v1/lists/{list_id}/tasks",
        access,
        method="POST",
        body={"title": title, "notes": notes or "", "due": due},
    )
    return _map_task(created)


async def complete_task(http: httpx.AsyncClient, refresh_token: str, task_id: str) -> dict[str, Any]:
    """Marca a tarefa como concluída."""
    access = await _access_token(http, refresh_token)
    list_id = await _default_task_list_id(http, access)
    updated = await _google_json(
        http,
        f"https://tasks.googleapis.com/tasks/v1/lists/{list_id}/tasks/{task_id}",
        access,
        method="PATCH",
        body={"status": "completed"},
    )
    return _map_task(updated)


async def _access_token(http: httpx.AsyncClient, refresh_token: str) -> str:
    """Renova o access token com o refresh token gravado no vínculo."""
    response = await http.post(
        "https://oauth2.googleapis.com/token",
        data={
            "client_id": google_client_id(),
            "client_secret": google_client_secret(),
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        },
    )
    data = response.json()
    token = data.get("access_token")
    if response.status_code >= 400 or not token:
        raise AgentError(data.get("error") or "Não foi possível renovar o acesso ao Google.", 502)
    return token


async def _default_task_list_id(http: httpx.AsyncClient, access: str) -> str:
    """Id da primeira lista de tarefas da conta."""
    data = await _google_json(http, TASKS_LISTS_URL, access)
    list_id = (data.get("items") or [{}])[0].get("id")
    if not list_id:
        raise AgentError("Nenhuma lista de tarefas no Google.", 502)
    return list_id


async def _google_json(
    http: httpx.AsyncClient,
    url: str,
    access: str,
    method: str = "GET",
    body: dict[str, Any] | None = None,
    params: dict[str, str] | None = None,
) -> Any:
    """Chama a API REST do Google e devolve o JSON. Falha com AgentError se o Google recusar."""
    response = await http.request(
        method,
        url,
        headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"},
        json=body,
        params=params,
    )
    data = response.json()
    if response.status_code >= 400:
        error = data.get("error") or {}
        raise AgentError(error.get("message") or f"Google retornou {response.status_code}", 502)
    return data


def _map_event(dto: dict[str, Any]) -> dict[str, str]:
    """Converte o DTO do Calendar para o formato interno da secretária."""
    start = dto.get("start") or {}
    end = dto.get("end") or {}
    return {
        "id": dto.get("id") or "",
        "title": (dto.get("summary") or "").strip() or "(sem título)",
        "start": start.get("dateTime") or start.get("date") or "",
        "end": end.get("dateTime") or end.get("date") or "",
        "description": (dto.get("description") or "").strip(),
    }


def _map_task(dto: dict[str, Any]) -> dict[str, Any]:
    """Converte o DTO do Tasks para o formato interno da secretária."""
    return {
        "id": dto.get("id") or "",
        "title": (dto.get("title") or "").strip() or "(sem título)",
        "notes": (dto.get("notes") or "").strip(),
        "due": dto.get("due"),
        "isCompleted": dto.get("status") == "completed",
    }


def _date_field(value: str) -> dict[str, str]:
    """Campo de data do Calendar no fuso da intranet."""
    return {"dateTime": value, "timeZone": TIME_ZONE}
