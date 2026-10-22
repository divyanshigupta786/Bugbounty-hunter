# PixelFlow

Lightweight image header validator and chunk parser for high-throughput image ingestion pipelines.

## Installation

```bash
pip install -e .
```

## Running Tests

```bash
pytest
```

## Known Issue Report (Issue #42)

**Title:** `parse_chunk_header` crashes with unhandled `struct.error` on short/truncated chunk data
**Reporter:** @frontend_dev
**Description:**
When uploading an image with a corrupted or truncated trailing chunk (less than 8 bytes), `parse_chunk_header` causes an unhandled `struct.error: unpack requires a buffer of 8 bytes` rather than raising `ImageValidationError`. This crashes the worker process.

**Expected behavior:**
Should raise `ImageValidationError("Truncated chunk header: expected at least 8 bytes")` or return a graceful error.

**Actual behavior:**
Unhandled `struct.error: unpack requires a buffer of 8 bytes`.
