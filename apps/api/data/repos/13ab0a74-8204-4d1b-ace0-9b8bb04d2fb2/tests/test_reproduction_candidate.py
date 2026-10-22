import pytest
from pixelflow import parse_chunk_header, ImageValidationError

def test_reproduce_truncated_chunk_header_crash():
    """
    Reproduction test for Issue #42: parse_chunk_header crash on truncated buffer.
    Expected behavior: ImageValidationError is raised on invalid/short buffer.
    Bug behavior: Crashes with struct.error or fails to validate.
    """
    truncated_payload = b"SHORT"
    # If the bug exists, this raises struct.error rather than ImageValidationError,
    # causing this assertion to fail with struct.error!
    with pytest.raises(ImageValidationError):
        parse_chunk_header(truncated_payload)
