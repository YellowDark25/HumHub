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
    """Tarefas abertas de todas as listas da conta."""
    access = await _access_token(http, refresh_token)
    return await _list_open_tasks(http, access)


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
    return _map_task(created, list_id)


async def complete_task(
    http: httpx.AsyncClient,
    refresh_token: str,
    task_id: str | None,
    title: str | None,
    list_id: str | None,
) -> dict[str, Any]:
    """Marca a tarefa como concluída. Acha pelo id ou pelo título nas listas abertas."""
    access = await _access_token(http, refresh_token)
    resolved = await _resolve_open_task(http, access, task_id, title, list_id)
    updated = await _google_json(
        http,
        f"https://tasks.googleapis.com/tasks/v1/lists/{resolved['listId']}/tasks/{resolved['id']}",
        access,
        method="PATCH",
        body={"status": "completed"},
    )
    mapped = _map_task(updated, resolved["listId"])
    if not mapped["isCompleted"]:
        raise AgentError("O Google não confirmou a conclusão da tarefa.", 502)
    return mapped


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
    lists = await _task_lists(http, access)
    return lists[0]["id"]


async def _task_lists(http: httpx.AsyncClient, access: str) -> list[dict[str, str]]:
    """Listas de tarefas da conta, na ordem que o Google devolve."""
    data = await _google_json(http, TASKS_LISTS_URL, access)
    lists = [
        {"id": str(item.get("id") or ""), "title": str(item.get("title") or "")}
        for item in data.get("items") or []
        if item.get("id")
    ]
    if not lists:
        raise AgentError("Nenhuma lista de tarefas no Google.", 502)
    return lists


async def _list_open_tasks(http: httpx.AsyncClient, access: str) -> list[dict[str, Any]]:
    """Tarefas ainda abertas em todas as listas."""
    tasks: list[dict[str, Any]] = []
    for task_list in await _task_lists(http, access):
        data = await _google_json(
            http,
            f"https://tasks.googleapis.com/tasks/v1/lists/{task_list['id']}/tasks",
            access,
            params={"showCompleted": "false"},
        )
        for item in data.get("items") or []:
            tasks.append(_map_task(item, task_list["id"]))
    return tasks


async def _resolve_open_task(
    http: httpx.AsyncClient,
    access: str,
    task_id: str | None,
    title: str | None,
    list_id: str | None,
) -> dict[str, Any]:
    """Encontra a tarefa aberta pelo id ou pelo título. Falha se não achar ou se o título for ambíguo."""
    open_tasks = await _list_open_tasks(http, access)
    wanted_id = (task_id or "").strip()
    if wanted_id:
        for task in open_tasks:
            if task["id"] == wanted_id and (not list_id or task["listId"] == list_id):
                return task
        raise AgentError("Não achei essa tarefa aberta.", 404)
    wanted_title = _normalize_title(title or "")
    if not wanted_title:
        raise AgentError("Informe o id ou o título da tarefa.", 400)
    matches = [task for task in open_tasks if _normalize_title(task["title"]) == wanted_title]
    if not matches:
        matches = [task for task in open_tasks if wanted_title in _normalize_title(task["title"])]
    if len(matches) == 1:
        return matches[0]
    if len(matches) > 1:
        raise AgentError("Há mais de uma tarefa aberta com esse título. Diga qual.", 409)
    raise AgentError("Não achei essa tarefa aberta.", 404)


def _normalize_title(value: str) -> str:
    """Compara títulos de tarefa sem maiúscula nem espaço extra."""
    return " ".join(value.strip().lower().split())


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


def _map_task(dto: dict[str, Any], list_id: str = "") -> dict[str, Any]:
    """Converte o DTO do Tasks para o formato interno da secretária."""
    return {
        "id": dto.get("id") or "",
        "listId": list_id or str(dto.get("listId") or ""),
        "title": (dto.get("title") or "").strip() or "(sem título)",
        "notes": (dto.get("notes") or "").strip(),
        "due": dto.get("due"),
        "isCompleted": dto.get("status") == "completed",
    }


def _date_field(value: str) -> dict[str, str]:
    """Campo de data do Calendar no fuso da intranet."""
    return {"dateTime": value, "timeZone": TIME_ZONE}
