import asyncio
import logging
from collections.abc import Awaitable, Callable
from typing import Any

from errors import AgentError

TurnRunner = Callable[[dict[str, Any]], Awaitable[None]]


class ConversationTurnInbox:
    """Agrupa recados da mesma DM e garante um turno por vez neste processo.

    Cada POST só atualiza o pendente e reinicia a espera. Quando a conversa
    quieta, roda um turno com o histórico já juntado. Mensagem no meio do
    turno marca nova rodada no fim, em vez de abrir outro loop em paralelo.
    """

    def __init__(self, runner: TurnRunner, debounce_seconds: float) -> None:
        """Guarda o executor do turno e o tempo de silêncio antes de responder."""
        self._runner = runner
        self._debounce_seconds = debounce_seconds
        self._guard = asyncio.Lock()
        self._pending: dict[int, dict[str, Any]] = {}
        self._debounce_tasks: dict[int, asyncio.Task[None]] = {}
        self._running: set[int] = set()
        self._rerun: set[int] = set()

    async def enqueue(self, payload: dict[str, Any]) -> None:
        """Enfileira o recado da conversa e adia o turno até o fio quietar."""
        conversation_id = int(payload.get("conversationId") or 0)
        if not conversation_id:
            raise AgentError("Turno da secretária inválido.", 400)

        async with self._guard:
            self._pending[conversation_id] = payload
            if conversation_id in self._running:
                self._rerun.add(conversation_id)
                logging.info(
                    "Turno em andamento; recado messageId=%s espera a próxima rodada",
                    payload.get("messageId"),
                )
                return
            self._restart_debounce(conversation_id)

    async def aclose(self) -> None:
        """Cancela esperas pendentes no shutdown do processo."""
        async with self._guard:
            tasks = list(self._debounce_tasks.values())
            self._debounce_tasks.clear()
        for task in tasks:
            task.cancel()
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    def _restart_debounce(self, conversation_id: int) -> None:
        """Reinicia a espera da conversa. Só chama com o lock preso."""
        previous = self._debounce_tasks.pop(conversation_id, None)
        if previous:
            previous.cancel()
        self._debounce_tasks[conversation_id] = asyncio.create_task(
            self._flush_after_quiet(conversation_id),
            name=f"secretary-debounce-{conversation_id}",
        )

    async def _flush_after_quiet(self, conversation_id: int) -> None:
        """Espera o silêncio e dispara o turno; cancelar só adia de novo."""
        try:
            await asyncio.sleep(self._debounce_seconds)
        except asyncio.CancelledError:
            return
        await self._run_until_quiet(conversation_id)

    async def _run_until_quiet(self, conversation_id: int) -> None:
        """Roda o turno e, se chegou recado no meio, roda de novo com o histórico novo."""
        if not await self._try_begin(conversation_id):
            return
        try:
            while True:
                payload = await self._take_pending(conversation_id)
                if payload is None:
                    return
                await self._runner(payload)
                if not await self._should_run_again(conversation_id):
                    return
        finally:
            await self._finish(conversation_id)

    async def _try_begin(self, conversation_id: int) -> bool:
        """Marca a conversa como em turno. False se outro loop já está rodando."""
        async with self._guard:
            self._debounce_tasks.pop(conversation_id, None)
            if conversation_id in self._running:
                self._rerun.add(conversation_id)
                return False
            self._running.add(conversation_id)
            return True

    async def _take_pending(self, conversation_id: int) -> dict[str, Any] | None:
        """Tira o último recado agrupado e limpa a marca de nova rodada."""
        async with self._guard:
            self._rerun.discard(conversation_id)
            return self._pending.pop(conversation_id, None)

    async def _should_run_again(self, conversation_id: int) -> bool:
        """Diz se chegou mensagem nova enquanto o turno rodava."""
        async with self._guard:
            return conversation_id in self._rerun or conversation_id in self._pending

    async def _finish(self, conversation_id: int) -> None:
        """Libera o turno e, se sobrou recado, agenda outra espera."""
        async with self._guard:
            self._running.discard(conversation_id)
            if conversation_id in self._pending or conversation_id in self._rerun:
                self._restart_debounce(conversation_id)
