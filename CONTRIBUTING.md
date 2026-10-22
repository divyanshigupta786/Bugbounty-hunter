# Contributing to BugBounty Hunter

We welcome contributions to BugBounty Hunter! As an open-source project, we are dedicated to making software bug reproduction trustworthy, verifiable, and accessible.

## Development Workflow

1. Fork and clone the repository.
2. Set up the Python backend in `apps/api` using virtual environment.
3. Install frontend dependencies in `apps/web`.
4. Run tests before submitting a Pull Request:
   ```bash
   npm run test:api
   npm run test:fixture
   npm --prefix apps/web run build
   ```

## Priority Areas for Contribution

- **Language Adapters:** Extend beyond Python to JavaScript/TypeScript (Jest/Vitest), Go, and Rust.
- **Model Providers:** Add provider adapters for new local or self-hosted inference servers.
- **Retrieval Strategies:** Implement enhanced semantic retrieval and symbol call-graph extraction.
- **Benchmark Cases:** Contribute controlled buggy repositories to `fixtures/` for reproducibility evaluation.

## Pull Request Guidelines

- Ensure all existing tests pass without regressions.
- Add unit or integration tests for new features.
- Avoid introducing unnecessary heavy dependencies.
- Follow the brand design system and accessibility guidelines.
