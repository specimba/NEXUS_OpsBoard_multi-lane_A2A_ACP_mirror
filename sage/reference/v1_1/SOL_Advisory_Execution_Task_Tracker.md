# NEXUS SOL Advisory — Execution Task Tracker

## Task 1: Windows Process-Level Containment & PTY Isolation
- `[/]` 1.1 Implement `WindowsAgentPTY` class in `sanitizer.py` using `ctypes` → `CreatePseudoConsole`
- `[/]` 1.2 Implement `spawn_sandboxed_windows_process()` with AppContainer low-integrity SID
- `[/]` 1.3 Add loopback network air-gap enforcement (block `127.0.0.1`/`localhost` from sandboxed agents)
- `[/]` 1.4 Write unit tests for `WindowsAgentPTY` and `spawn_sandboxed_windows_process`

## Task 2: Guard Cascade L2 MindGuard TAE Integration
- `[/]` 2.1 Implement `MindGuardTAE` class (Temporal Attention Entropy inspector)
- `[/]` 2.2 Wire `MindGuardTAE` into `guard_router.py` L2 tier
- `[/]` 2.3 Add dilution_threshold (0.25) and delegation_threshold (0.15) config
- `[/]` 2.4 Write unit tests for TAE detection logic

## Task 3: Bridge Persistent Audit Hardening
- `[/]` 3.1 Audit `bridge/server.py` for any remaining in-memory task storage
- `[/]` 3.2 Ensure CSI audit log is append-only mandatory (not optional file path)
- `[/]` 3.3 Add VAP event persistence to SQLite `vap_events` table
- `[/]` 3.4 Verify TokenGuard audit writes are persistent

## Task 4: Verification & Integration
- `[ ]` 4.1 Run full security test suite (`pytest tests/security/`)
- `[ ]` 4.2 Verify no regressions in existing guard_router tests
- `[ ]` 4.3 Create walkthrough artifact documenting all changes
