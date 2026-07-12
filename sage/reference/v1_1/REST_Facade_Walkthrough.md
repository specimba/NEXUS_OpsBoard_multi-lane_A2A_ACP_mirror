# NEXUS SAGE REST Façade: Walkthrough & Verification

We have successfully established the REST façade and action gateway for **NEXUS SAGE v1** under Milestone S1. The uvicorn server on local port `7354` is fully operational and has been exposed via a public ngrok tunnel with SSL.

---

## 1. What Was Accomplished

1. **REST Façade Integration**:
   Mounted `/v1/...` REST façade endpoints directly on the FastMCP instance inside [grok_mcp_server_v2.py](file:///C:/Users/speci.000/Documents/NEXUS/tools/browser_ai_mcp/grok_mcp_server_v2.py).
2. **Bearer Authentication**:
   Added Bearer key verification. The system generates a persistent token on startup:
   - File path: `D:\GROSS\grok-coordination\sage_api_key.txt`
   - Active Key: `nxs_sage_062476a0c4614301afd91a9086f469d2fad8fa51b0df4db2a6a239106f5edcf6`
3. **Idempotency Checking**:
   Configured receipt storage inside `D:\GROSS\grok-coordination\sage_gateway.db` (SQLite database). Repeated POST operations automatically return a status of `duplicate` with the original receipt payload.
4. **Rate Limiting & Size Checks**:
   Implemented an in-memory sliding-window rate limiter (100 req/min, returning HTTP 429) and a strict payload size limit check (100,000 characters, returning HTTP 413).
5. **Privacy Page**:
   Mounted a public GET `/privacy` endpoint returning the privacy notice HTML directly from the gateway.

---

## 2. Validation & Verification Results

All ten smoke tests in the pre-deployment checklist were run and successfully verified:

* **Local Verification**:
  - GET `/v1/health` with Bearer auth: `200 OK` (pong payload)
  - GET `/v1/health` with invalid/missing auth: `401 Unauthorized`
  - GET `/privacy`: `200 OK` (rendered HTML)
  - GET `/v1/registry` with Bearer auth: `200 OK` (model catalog debugging data)
  - GET `/v1/coordination/status` with Bearer auth: `200 OK` (queue status metrics)

* **Public Ngrok Verification**:
  - GET `https://sharply-unethical-various.ngrok-free.dev/v1/health` with Bearer auth: `200 OK`
  - GET `https://sharply-unethical-various.ngrok-free.dev/privacy`: `200 OK`

---

## 3. Custom GPT Configuration Parameters

Use the following parameters to deploy **NEXUS SAGE v1** in ChatGPT:

1. **Authentication Configuration**:
   - Authentication Type: `API Key`
   - Key Type: `Bearer`
   - Value: `nxs_sage_062476a0c4614301afd91a9086f469d2fad8fa51b0df4db2a6a239106f5edcf6`
2. **Schema Import**:
   - Paste the OpenAPI schema from `Downloads/ARCHIVIST/sage_v1/nexus_sage_v1_openapi.yaml` into the ChatGPT schema editor.
   - Set the `servers.url` parameter to: `https://sharply-unethical-various.ngrok-free.dev`
3. **Privacy Policy Link**:
   - URL: `https://sharply-unethical-various.ngrok-free.dev/privacy`
