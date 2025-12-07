import json
import logging

from app.helpers import to_jsonable
from app.sse.events import EventName
from openai._models import BaseModel
from openai.types.responses import (
    ResponseCompletedEvent,
    ResponseContentPartAddedEvent,
    ResponseContentPartDoneEvent,
    ResponseCreatedEvent,
    ResponseInProgressEvent,
    ResponseMcpCallArgumentsDeltaEvent,
    ResponseMcpCallArgumentsDoneEvent,
    ResponseMcpCallCompletedEvent,
    ResponseMcpCallFailedEvent,
    ResponseMcpCallInProgressEvent,
    ResponseOutputItemAddedEvent,
    ResponseOutputItemDoneEvent,
    ResponseTextDeltaEvent,
    ResponseTextDoneEvent,
)

logger = logging.getLogger(__name__)


def handle_event(event: BaseModel) -> dict | None:
    # The events are subclasses of BaseModel, so we can use isinstance to check the type.
    if isinstance(event, ResponseCreatedEvent):
        return handle_response_created_event(event)
    elif isinstance(event, ResponseInProgressEvent):
        return handle_response_in_progress_event(event)
    elif isinstance(event, ResponseCompletedEvent):
        return handle_response_completed_event(event)
    elif isinstance(event, ResponseContentPartDoneEvent):
        return handle_response_content_part_done_event(event)
    elif isinstance(event, ResponseOutputItemAddedEvent):
        return handle_response_output_item_added_event(event)
    elif isinstance(event, ResponseOutputItemDoneEvent):
        return handle_response_output_item_done_event(event)
    elif isinstance(event, ResponseTextDeltaEvent):
        return handle_response_text_delta_event(event)
    elif isinstance(event, ResponseTextDoneEvent):
        return handle_response_text_done_event(event)
    elif isinstance(event, ResponseMcpCallCompletedEvent):
        return handle_response_mcp_call_completed_event(event)
    elif isinstance(event, ResponseMcpCallFailedEvent):
        return handle_response_mcp_call_failed_event(event)
    elif isinstance(event, ResponseMcpCallArgumentsDoneEvent):
        return handle_response_mcp_call_arguments_done_event(event)
    elif isinstance(event, ResponseMcpCallArgumentsDeltaEvent):
        return handle_response_mcp_call_arguments_delta_event(event)
    elif isinstance(event, ResponseMcpCallInProgressEvent):
        return handle_response_mcp_call_in_progress_event(event)
    elif isinstance(event, ResponseContentPartAddedEvent):
        return handle_response_content_part_added_event(event)
    else:
        # raise ValueError(f"Unknown event type: {type(event)}")
        # TODO: Log unknown event type.
        logger.warning(f"Unknown {type(event)} event type : {event.model_dump_json()}")
        return None


def handle_response_created_event(event: ResponseCreatedEvent) -> dict:
    return dict(
        event=EventName.CHAT_STATUS,
        data={"status": "created"},
    )


def handle_response_in_progress_event(
    event: ResponseInProgressEvent,
) -> dict:
    return dict(
        event=EventName.CHAT_STATUS,
        data={"status": "in_progress"},
    )


def handle_response_output_item_added_event(
    event: ResponseOutputItemAddedEvent,
) -> dict | None:
    # Tool call started?
    if event.item.type == "mcp_call":
        return dict(
            event=EventName.MCP_CALL,
            data={**event.item.model_dump(), "status": "start"},
        )
    elif event.item.type == "message":
        # Insert bullet for each item in the list
        return dict(
            event=EventName.MESSAGE,
            data={**event.item.model_dump(), "status": "start"},
        )
    else:
        # TODO: Log unknown event type.
        logger.warning(
            f"Unknown ResponseOutputItemAddedEvent item type: {event.item.model_dump_json()}"
        )
        return None


def handle_response_mcp_call_in_progress_event(
    event: ResponseMcpCallInProgressEvent,
) -> dict:
    return dict(
        event=EventName.MCP_CALL,
        data={"status": "in_progress"},
    )


def handle_response_mcp_call_arguments_delta_event(
    event: ResponseMcpCallArgumentsDeltaEvent,
) -> dict:
    # We use the mcp_call_arguments_done event to handle this.
    pass


def handle_response_mcp_call_arguments_done_event(
    event: ResponseMcpCallArgumentsDoneEvent,
) -> dict:
    arguments = event.arguments

    data = to_jsonable(arguments)

    return dict(
        event=EventName.MCP_CALL,
        data={"arguments": data, "status": "arguments"},
    )


def handle_response_mcp_call_failed_event(
    event: ResponseMcpCallFailedEvent,
) -> dict:
    # We use the output_item_done event to handle this.
    pass


def handle_response_mcp_call_completed_event(
    event: ResponseMcpCallCompletedEvent,
) -> dict:
    # We use the output_item_done event to handle this.
    pass


def handle_response_content_part_added_event(
    event: ResponseContentPartAddedEvent,
) -> dict:
    pass


def handle_response_text_delta_event(
    event: ResponseTextDeltaEvent,
) -> dict:
    return dict(
        event=EventName.MESSAGE,
        data={"text": event.delta, "status": "delta"},
    )


def handle_response_text_done_event(
    event: ResponseTextDoneEvent,
) -> dict:
    return dict(
        event=EventName.MESSAGE,
        data={"text": event.text, "status": "text_done"},
    )


def handle_response_content_part_done_event(
    event: ResponseContentPartDoneEvent,
) -> dict:
    # We use the response_output_item_done event to handle this.
    # return dict(
    #     event="content_part_done",
    #     data={"part": event.part.model_dump()},
    # )
    pass


def handle_response_output_item_done_event(
    event: ResponseOutputItemDoneEvent,
) -> dict | None:
    # TODO: Store to DB.
    output = None
    if event.item.type == "mcp_call":
        # Emit the raw tool result
        error = event.item.error
        result_content = event.item.output
        arguments = event.item.arguments
        # Some servers prefix "root=", normalize if so

        if arguments:
            arguments = to_jsonable(arguments)

        if error:
            error = json.dumps(error, indent=2, ensure_ascii=False)
        elif result_content and isinstance(result_content, str):
            result_content = to_jsonable(result_content)

        output = dict(
            event=EventName.MCP_CALL,
            data={
                **event.item.model_dump(),
                "status": "done",
                "output": result_content,
                "error": error,
                "arguments": arguments,
            },
        )
    elif event.item.type == "message":
        output = dict(
            event=EventName.MESSAGE,
            data={**event.item.model_dump(), "status": "done"},
        )
    else:
        # TODO: Log unknown event type.
        logger.warning(
            f"Unknown ResponseOutputItemDoneEvent item type: {event.item.model_dump_json()}"
        )

    # TODO: Store to DB.
    # Process final output here. Store to DB.
    # output = event.item.model_dump()

    return output


def handle_response_completed_event(event: ResponseCompletedEvent) -> dict:
    return dict(
        event=EventName.CHAT_STATUS,
        data={"status": "completed", "response_id": event.response.id},
    )
