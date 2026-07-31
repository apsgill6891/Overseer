import json
import tempfile
import unittest
from pathlib import Path

from overseer_server import Conflict, Store


class StoreTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store = Store(Path(self.temp.name) / "test.db")
        self.operator = {"id": "operator@example.com", "role": "operator"}

    def tearDown(self):
        self.temp.cleanup()

    def test_run_is_durable_audited_and_idempotent(self):
        self.store.set_bounded_execution(
            {"id": "admin@example.com", "role": "admin"}, True,
            "Enable bounded execution for automated test",
        )
        payload = {"order_ids": ["FS-10421"], "mode": "bounded"}
        first, replayed = self.store.create_run(self.operator, payload, "test-key-000001")
        second, replayed_second = self.store.create_run(
            self.operator, payload, "test-key-000001"
        )
        self.assertFalse(replayed)
        self.assertTrue(replayed_second)
        self.assertEqual(first, second)
        self.assertEqual("Ready to fulfill", self.store.list_orders()[0]["status"])
        self.assertTrue(self.store.verify_audit()["valid"])

    def test_idempotency_key_cannot_change_request(self):
        self.store.create_run(
            self.operator, {"order_ids": ["FS-10421"]}, "test-key-000002"
        )
        with self.assertRaises(Conflict):
            self.store.create_run(
                self.operator, {"order_ids": ["FS-10422"]}, "test-key-000002"
            )

    def test_shadow_mode_does_not_change_order(self):
        before = self.store.list_orders()[0]
        result, _ = self.store.create_run(
            self.operator, {"order_ids": [before["id"]], "mode": "shadow"},
            "test-key-shadow-001",
        )
        after = self.store.list_orders()[0]
        self.assertEqual("Shadow complete", result["status"])
        self.assertEqual(before["status"], after["status"])
        self.assertEqual(before["version"], after["version"])

    def test_bounded_mode_is_fail_closed(self):
        with self.assertRaises(Conflict):
            self.store.create_run(
                self.operator, {"order_ids": ["FS-10421"], "mode": "bounded"},
                "test-key-bounded-01",
            )

    def test_requester_cannot_approve_own_run(self):
        result, _ = self.store.create_run(
            self.operator, {"order_ids": ["FS-10421"], "mode": "recommend"},
            "test-key-approval-01",
        )
        approval = self.store.list_approvals()[0]
        with self.assertRaises(Conflict):
            self.store.decide(
                self.operator, approval["id"],
                {"decision": "approve", "note": "Approve the recommended plan"},
            )
        approver = {"id": "approver@example.com", "role": "approver"}
        decision = self.store.decide(
            approver, approval["id"],
            {"decision": "approve", "note": "Independent review completed"},
        )
        self.assertEqual("Approved", decision["status"])


if __name__ == "__main__":
    unittest.main()
