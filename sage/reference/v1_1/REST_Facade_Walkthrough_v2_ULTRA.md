# NEXUS SAGE REST Façade: Walkthrough & Verification (v2 ULTRA)

We have successfully established and verified **NEXUS SAGE v2 (ULTRA)** under Milestone S2. The uvicorn server on local port `7354` is fully operational with all 10 new v2 endpoints, A2A messaging, model health, memory reads, and swarm coordination.

---

## 1. What Was Accomplished

1. **SAGE v2 ULTRA REST Integration**:
   Implemented and mounted 10 new SAGE v2 endpoints on the FastMCP starlette instance inside [grok_mcp_server_v2.py](file:///C:/Users/speci.000/Documents/NEXUS/tools/browser_ai_mcp/grok_mcp_server_v2.py):
   - `POST /v1/swarm/dispatch` — Triggers parallel subagent swarm/foreman task execution on the NEXUS backend.
   - `GET /v1/swarm/status/{task_id}` — Polls status of a dispatched swarm task.
   - `POST /v1/program` — Runs Python programs inside the Docker Sterile Lab sandbox.
   - `GET /v1/grounding` — Fetches fresh canonical context (`01_PROJECT_STATE.md`, `GROUNDING.md`, etc.).
   - `GET /v1/agents` — Lists all registered agents and their status.
   - `GET /v1/evidence/search` — Performs search queries across captured evidence files.
   - `GET /v1/models/health` — Checks local ModelRelay models catalog and server health.
   - `GET /v1/trust/{agent_id}` — Reads agent trust scores.
   - `GET /v1/memory/{channel}` — Reads recent records from the 8-channel memory vault.
   - `GET /v1/providers/status` — Checks provider status and quotas.

2. **Bearer Authentication & Idempotency**:
   - Authentication token: `nxs_sage_062476a0c4614301afd91a9086f469d2fad8fa51b0df4db2a6a239106f5edcf6`
   - Key storage: [sage_api_key.txt](file:///C:/Users/speci.000/Documents/NEXUS/scratch/browser_ai_mcp_runtime/sage_api_key.txt)
   - Idempotency DB: [sage_gateway.db](file:///C:/Users/speci.000/Documents/NEXUS/scratch/browser_ai_mcp_runtime/sage_gateway.db)

3. **OpenAPI Schema & Custom GPT Instructions**:
   - Created [nexus_sage_v2_openapi.yaml](file:///C:/Users/speci.000/Downloads/ARCHIVIST/sage_v1/nexus_sage_v2_openapi.yaml) defining all v1 and v2 REST endpoints.
   - Created [nexus_sage_v2_instructions.md](file:///C:/Users/speci.000/Downloads/ARCHIVIST/sage_v1/nexus_sage_v2_instructions.md) updated with instructions for GPT-5.6's multi-agent swarm dispatch and programmatic tool calling.

---

## 2. Validation & Verification Results

All 14 tests in the test suite [test_sage_v2.py](file:///C:/Users/speci.000/Documents/NEXUS/scratch/test_sage_v2.py) have successfully passed:

* **SAGE v1 Endpoints**:
  - `GET /v1/health`: PASS (`200 OK`)
  - `GET /v1/registry`: PASS (`200 OK`)
  - `GET /v1/coordination/status`: PASS (`200 OK`)

* **SAGE v2 ULTRA Endpoints**:
  - `GET /v1/grounding`: PASS (`200 OK`) — returned fresh canonical files.
  - `GET /v1/agents`: PASS (`200 OK`) — returned list of registered agents.
  - `GET /v1/evidence/search`: PASS (`200 OK`) — searched through evidence files successfully.
  - `GET /v1/models/health`: PASS (`200 OK`) — queried ModelRelay on port `7350` successfully.
  - `GET /v1/trust/test-agent`: PASS (`404 Not Found` as expected since the agent does not exist).
  - `GET /v1/memory/episodic`: PASS (`200 OK`) — successfully serialized the 8-channel memory vault records.
  - `GET /v1/providers/status`: PASS (`200 OK`) — returned the registry provider status.
  - `POST /v1/swarm/dispatch`: PASS (`200 OK`) — successfully dispatched task using idempotency controls.
  - `GET /v1/swarm/status/{task_id}`: PASS (`200 OK`) — polled task list successfully.
  - `POST /v1/program`: PASS (`200 OK`) — submitted program successfully to sandbox manager.

* **Security**:
  - Invalid Bearer Token: PASS (rejected with `401 Unauthorized` as expected).

---

## 3. Custom GPT Configuration Parameters

Use the following parameters to deploy or update **NEXUS SAGE v2** in ChatGPT:

1. **Authentication Configuration**:
   - Authentication Type: `API Key`
   - Key Type: `Bearer`
   - Value: `nxs_sage_062476a0c4614301afd91a9086f469d2fad8fa51b0df4db2a6a239106f5edcf6`

2. **Schema Import**:
   - Paste the OpenAPI schema from [nexus_sage_v2_openapi.yaml](file:///C:/Users/speci.000/Downloads/ARCHIVIST/sage_v1/nexus_sage_v2_openapi.yaml) into the ChatGPT schema editor.
   - Set the `servers.url` parameter to: `https://sharply-unethical-various.ngrok-free.dev`

3. **Instructions**:
   - Copy-paste the content of [nexus_sage_v2_instructions.md](file:///C:/Users/speci.000/Downloads/ARCHIVIST/sage_v1/nexus_sage_v2_instructions.md) into the ChatGPT Custom Instructions editor.

4. **Privacy Policy Link**:
   - URL: `https://sharply-unethical-various.ngrok-free.dev/privacy`
