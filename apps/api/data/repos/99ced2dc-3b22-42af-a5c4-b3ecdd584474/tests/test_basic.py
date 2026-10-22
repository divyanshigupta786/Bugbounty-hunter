import pytest
from pixelflow import (
    validate_header,
    parse_chunk_header,
    calculate_aspect_ratio,
    ImageValidationError,
)
from pixelflow.validator import PNG_MAGIC, JPEG_MAGIC


def test_validate_valid_png_header():
    assert validate_header(PNG_MAGIC + b"extra_content") == "png"


def test_validate_valid_jpeg_header():
    assert validate_header(JPEG_MAGIC + b"\xe0\x00\x10JFIF") == "jpeg"


def test_validate_invalid_header():
    with pytest.raises(ImageValidationError):
        validate_header(b"GIF89a")


def test_parse_valid_chunk():
    # 4 bytes length (value: 12) + 4 bytes chunk name (IHDR)
    chunk_bytes = b"\x00\x00\x00\x0cIHDR" + b"extra_data"
    result = parse_chunk_header(chunk_bytes)
    assert result["length"] == 12
    assert result["type"] == "IHDR"


def test_calculate_aspect_ratio_standard():
    assert calculate_aspect_ratio(1920, 1080) == 1.7778
    assert calculate_aspect_ratio(800, 600) == 1.3333
