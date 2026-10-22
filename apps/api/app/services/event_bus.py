import asyncio
import json
from typing import Dict, Set, Any
from app.schemas.investigation import InvestigationEventSchema


class EventBus:
    """In-memory pub/sub broker for Server-Sent Events (SSE) streaming."""

    def __init__(self):
        self._subscribers: Dict[str, Set[asyncio.Queue]] = {}
        self._lock = asyncio.Lock()

    async def subscribe(self, investigation_id: str) -> asyncio.Queue:
        async with self._lock:
            if investigation_id not in self._subscribers:
                self._subscribers[investigation_id] = set()
            queue = asyncio.Queue()
            self._subscribers[investigation_id].add(queue)
            return queue

    async def unsubscribe(self, investigation_id: str, queue: asyncio.Queue):
        async with self._lock:
            if investigation_id in self._subscribers:
                self._subscribers[investigation_id].discard(queue)
                if not self._subscribers[investigation_id]:
                    del self._subscribers[investigation_id]

    async def publish(self, investigation_id: str, event_data: Dict[str, Any]):
        async with self._lock:
            queues = list(self._subscribers.get(investigation_id, set()))

        payload = f"data: {json.dumps(event_data, default=str)}\n\n"
        for q in queues:
            try:
                q.put_nowait(payload)
            except asyncio.QueueFull:
                pass


event_bus = EventBus()
