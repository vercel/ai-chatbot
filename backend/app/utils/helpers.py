import ast
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, TypedDict, Union

import json5


def format_sse(payload: dict) -> str:
    """Format a payload as Server-Sent Event."""
    return f"data: {json.dumps(payload, separators=(',', ':'))}\n\n"


def get_date_string():
    return datetime.now(timezone.utc).strftime("%A, %B %d, %Y")


def sse_frame(
    *,
    data: Union[str, Dict[str, Any], List[Any], None],
    id: Optional[str] = None,
    event: Optional[str] = None,
) -> str:
    """Format an SSE frame (no trailing newlines added by caller)."""
    if data is None:
        payload = "null"
    elif isinstance(data, (dict, list)):
        payload = json.dumps(data, ensure_ascii=False)
    else:
        payload = str(data)

    lines: List[str] = []
    if event:
        lines.append(f"event: {event}")
    if id:
        lines.append(f"id: {id}")
    for line in payload.splitlines() or [""]:
        lines.append(f"data: {line}")
    # Blank line terminates the SSE message

    # Make sure the last line is terminated with a double newline.
    # This is required by the SSE spec.
    # https://html.spec.whatwg.org/multipage/server-sent-events.html#sse
    # https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#sending_events_from_the_server
    return "\n".join(lines) + "\n\n"


class JsonEnvelope(TypedDict, total=False):
    _raw: str
    parsed: Union[dict, list, None]


def process_root_json(value: str) -> Union[dict, list, None]:
    """
    If the string starts with 'root=', try to parse the remainder.
    Returns a dict/list on success, else None.
    """
    s = value.lstrip()
    if not s.startswith("root="):
        return None

    payload = s[5:].strip()

    # Try JSON5 (handles comments, single quotes, trailing commas, unquoted keys)
    try:
        obj = json5.loads(payload)
        return obj if isinstance(obj, (dict, list)) else None
    except Exception:
        pass

    # Fallback: some tools emit Python reprs; ast.literal_eval is safe for these
    try:
        obj = ast.literal_eval(payload)
        return obj if isinstance(obj, (dict, list)) else None
    except Exception:
        return None


def to_jsonable(value: Any) -> JsonEnvelope:
    """
    Convert a value to a JSON-serializable envelope:
    {
      "_raw": <original as string>,
      "parsed": <dict|list|None>  # only objects/arrays allowed for JSONB
    }
    """
    if value is None:
        return {"_raw": None, "parsed": None}

    raw_str = value if isinstance(value, str) else repr(value)
    out: JsonEnvelope = {"_raw": raw_str, "parsed": None}

    # Pydantic v2
    if hasattr(value, "model_dump"):
        try:
            dumped = value.model_dump(exclude_none=True)
            if isinstance(dumped, (dict, list)):
                out["parsed"] = dumped
            return out
        except Exception:
            return out

    # Native containers
    if isinstance(value, (dict, list)):
        out["parsed"] = value
        return out

    # Strings → try JSON5, then standard JSON, then root=..., else leave parsed=None
    if isinstance(value, str):
        s = value.strip()
        if s:
            for loader in (json5.loads, json.loads):
                try:
                    obj = loader(s)
                    if isinstance(obj, (dict, list)):
                        out["parsed"] = obj
                        return out
                except Exception:
                    pass

            root_obj = process_root_json(s)
            if isinstance(root_obj, (dict, list)):
                out["parsed"] = root_obj

    return out
