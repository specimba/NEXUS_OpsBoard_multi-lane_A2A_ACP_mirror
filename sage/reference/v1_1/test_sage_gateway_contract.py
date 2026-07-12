"""Contract tests for the NEXUS SAGE v1.1 hardening pack."""

from __future__ import annotations

import json
from pathlib import Path
import tempfile
import unittest

try:
    import yaml
except ImportError:  # pragma: no cover
    yaml = None

from sage_idempotency import IdempotencyStore
from sage_jobs import JobStore


class IdempotencyTests(unittest.TestCase):
    def test_fresh_duplicate_and_changed_payload_conflict(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = IdempotencyStore(Path(directory) / "idempotency.db")
            arguments = {
                "principal": "sage-key-a",
                "operation": "nexusPublishMessage",
                "idempotency_key": "test-key-0000000001",
            }

            first = store.reserve(payload={"message": "alpha"}, **arguments)
            self.assertEqual(first.state, "reserved")

            # An uncompleted first request must not be treated as a successful duplicate.
            in_progress = store.reserve(payload={"message": "alpha"}, **arguments)
            self.assertEqual(in_progress.state, "in_progress")

            store.complete(
                response={"receipt_id": "receipt-1", "status": "recorded"},
                http_status=201,
                **arguments,
            )

            replay = store.reserve(payload={"message": "alpha"}, **arguments)
            self.assertEqual(replay.state, "duplicate")
            self.assertEqual(replay.http_status, 201)

            changed = store.reserve(payload={"message": "beta"}, **arguments)
            self.assertEqual(changed.state, "conflict")


class JobTests(unittest.TestCase):
    def test_claim_lease_complete(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = JobStore(Path(directory) / "jobs.db")
            job_id = store.submit(
                principal="sage-key-a",
                workflow_type="grounding_audit",
                parameters={"files": ["GROUNDING.md"]},
            )

            queued = store.get(job_id)
            self.assertIsNotNone(queued)
            self.assertEqual(queued.state, "queued")

            claimed = store.claim_next(worker_id="hermes-worker-1")
            self.assertIsNotNone(claimed)
            self.assertEqual(claimed.job_id, job_id)
            self.assertEqual(claimed.state, "running")

            store.complete(
                job_id=job_id,
                worker_id="hermes-worker-1",
                result={"status": "verified"},
            )
            completed = store.get(job_id)
            self.assertEqual(completed.state, "succeeded")

    def test_arbitrary_program_is_not_allowlisted(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = JobStore(Path(directory) / "jobs.db")
            with self.assertRaises(ValueError):
                store.submit(
                    principal="sage-key-a",
                    workflow_type="arbitrary_python",
                    parameters={"code": "print('no')"},
                )


class OpenApiTests(unittest.TestCase):
    @unittest.skipIf(yaml is None, "PyYAML not installed")
    def test_production_schema_constraints(self) -> None:
        schema_path = Path(__file__).with_name("nexus_sage_v1_1_openapi.yaml")
        document = yaml.safe_load(schema_path.read_text(encoding="utf-8"))

        self.assertEqual(document["openapi"], "3.1.0")
        self.assertTrue(document["servers"][0]["url"].startswith("https://"))
        self.assertNotIn("/v1/program", document["paths"])
        self.assertNotIn("/v1/probes/simulate", document["paths"])

        operation_ids: list[str] = []
        for methods in document["paths"].values():
            for method, operation in methods.items():
                if method.lower() not in {"get", "post", "put", "patch", "delete"}:
                    continue
                operation_ids.append(operation["operationId"])
                if method.lower() != "get":
                    self.assertIn("x-openai-isConsequential", operation)

        self.assertEqual(len(operation_ids), len(set(operation_ids)))
        raw = schema_path.read_text(encoding="utf-8")
        self.assertNotIn("nullable:", raw)

        # Mutating routes must advertise conflict and validation behavior.
        for path, methods in document["paths"].items():
            for method, operation in methods.items():
                if method.lower() == "post" and path != "/v1/sessions/heartbeat":
                    response_codes = set(operation["responses"])
                    self.assertTrue(
                        {"409", "422"} & response_codes,
                        msg=f"{method.upper()} {path} lacks conflict/validation response",
                    )


if __name__ == "__main__":
    unittest.main()
