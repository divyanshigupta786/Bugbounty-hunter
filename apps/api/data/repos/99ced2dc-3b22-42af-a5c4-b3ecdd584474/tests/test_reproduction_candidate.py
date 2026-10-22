import pytest
from pixelflow import validate_header, ImageValidationError

def test_reproduce_generic_edge_case():
    with pytest.raises(ImageValidationError):
        validate_header(b"x")
