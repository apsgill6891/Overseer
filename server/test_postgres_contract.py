import os
import unittest


@unittest.skipUnless(
    os.environ.get("OVERSEER_TEST_POSTGRES_URL"),
    "set OVERSEER_TEST_POSTGRES_URL to run PostgreSQL integration tests",
)
class PostgresContractTests(unittest.TestCase):
    def test_store_contract(self):
        from postgres_store import PostgresStore

        store = PostgresStore(os.environ["OVERSEER_TEST_POSTGRES_URL"])
        self.assertTrue(store.verify_audit()["valid"])
        self.assertGreaterEqual(len(store.list_orders()), 10)
        self.assertEqual(
            "disabled", store.controls()["bounded_execution"]["value"]
        )


if __name__ == "__main__":
    unittest.main()
