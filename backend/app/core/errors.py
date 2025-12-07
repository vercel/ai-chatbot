from typing import Optional

from fastapi import HTTPException, status


class ChatSDKError(HTTPException):
    def __init__(self, error_code: str, detail: Optional[str] = None, status_code: int = 500):
        self.error_code = error_code
        self.detail = detail or self._get_message(error_code)
        super().__init__(status_code=status_code, detail=self.detail)

    def _get_message(self, error_code: str) -> str:
        messages = {
            "bad_request:api": "The request couldn't be processed. Please check your input and try again.",
            "unauthorized:chat": "You need to sign in to view this chat. Please sign in and try again.",
            "unauthorized:vote": "You need to sign in to vote. Please sign in and try again.",
            "forbidden:chat": "This chat belongs to another user. Please check the chat ID and try again.",
            "forbidden:vote": "This chat belongs to another user. You cannot vote on messages in this chat.",
            "not_found:chat": "The requested chat was not found. Please check the chat ID and try again.",
            "not_found:vote": "The requested chat or message was not found. Please check the IDs and try again.",
            "not_found:document": "The requested document was not found. Please check the document ID and try again.",
            "unauthorized:document": "You need to sign in to access this document. Please sign in and try again.",
            "forbidden:document": "This document belongs to another user. You cannot access this document.",
            "rate_limit:chat": "You have exceeded your maximum number of messages for the day. Please try again later.",
            "offline:chat": "We're having trouble sending your message. Please check your internet connection and try again.",
            "offline:api": "We're having trouble processing your request. Please check your internet connection and try again.",
        }
        return messages.get(error_code, "Something went wrong. Please try again later.")


def get_status_code(error_type: str) -> int:
    status_codes = {
        "bad_request": status.HTTP_400_BAD_REQUEST,
        "unauthorized": status.HTTP_401_UNAUTHORIZED,
        "forbidden": status.HTTP_403_FORBIDDEN,
        "not_found": status.HTTP_404_NOT_FOUND,
        "rate_limit": status.HTTP_429_TOO_MANY_REQUESTS,
        "offline": status.HTTP_503_SERVICE_UNAVAILABLE,
    }
    return status_codes.get(error_type, status.HTTP_500_INTERNAL_SERVER_ERROR)
