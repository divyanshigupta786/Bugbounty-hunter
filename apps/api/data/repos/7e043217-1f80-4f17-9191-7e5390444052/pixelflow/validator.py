"""Core validator and parser for PixelFlow image headers."""

import struct
from typing import Dict, Any, Tuple


class ImageValidationError(Exception):
    """Raised when an image payload or header fails validation constraints."""
    pass


PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
JPEG_MAGIC = b"\xff\xd8\xff"


def validate_header(data: bytes) -> str:
    """Validate magic bytes of image header. Returns 'png' or 'jpeg'."""
    if not isinstance(data, (bytes, bytearray)):
        raise TypeError("Header data must be bytes or bytearray")

    if len(data) < 3:
        raise ImageValidationError("Header data is too short to determine format")

    if data.startswith(PNG_MAGIC):
        return "png"
    if data.startswith(JPEG_MAGIC):
        return "jpeg"

    raise ImageValidationError("Unsupported image format")


def parse_chunk_header(data: bytes) -> Dict[str, Any]:
    """
    Parse a 8-byte chunk header (4 bytes length + 4 bytes chunk type).
    BUG: Fails to check if len(data) >= 8 before unpacking.
    When given a truncated buffer (< 8 bytes), struct.unpack raises struct.error
    instead of raising ImageValidationError or returning a structured error.
    """
    if not isinstance(data, (bytes, bytearray)):
        raise TypeError("Chunk data must be bytes")

    # BUG: Missing length check!
    # If len(data) < 8, this crashes with unhandled struct.error instead of ImageValidationError
    length, chunk_type = struct.unpack(">I4s", data[:8])
    return {
        "length": length,
        "type": chunk_type.decode("ascii", errors="replace"),
    }


def calculate_aspect_ratio(width: int, height: int) -> float:
    """
    Calculate width / height aspect ratio.
    BUG: If height <= 0, raises ZeroDivisionError or ValueError.
    """
    if not isinstance(width, int) or not isinstance(height, int):
        raise TypeError("Dimensions must be integers")

    if width <= 0:
        raise ValueError("Width must be greater than zero")

    # BUG: height == 0 raises ZeroDivisionError without proper domain validation
    return round(width / height, 4)
