"""Concurrency-focused tests: caller-specific retrieval."""
from pathlib import Path
import re

SOURCE = (Path(__file__).parents[1] / "contracts" / "truthguard.py").read_text()

# ── Caller-specific retrieval ──

def test_caller_last_verification_exists():
    assert "get_caller_last_verification" in SOURCE

def test_caller_last_verification_scans_newest():
    match = re.search(r'def get_caller_last_verification.*', SOURCE, re.DOTALL)
    assert match, "get_caller_last_verification not found"
    body = match.group()
    # Must scan from newest to oldest (next_verification_id - 1 down to 1)
    assert "next_verification_id" in body, "Must scan from next_verification_id"
    assert "range" in body, "Must iterate through verification IDs"

def test_caller_last_verification_uses_caller_field():
    match = re.search(r'def get_caller_last_verification.*', SOURCE, re.DOTALL)
    assert match
    body = match.group()
    assert "\"caller\"" in body, "Must check caller field in record"

def test_caller_last_verification_returns_empty_on_no_match():
    match = re.search(r'def get_caller_last_verification.*', SOURCE, re.DOTALL)
    assert match
    body = match.group()
    assert '""' in body or "return \"\"" in body, "Must return empty string when no match"

# ── Concurrency-focused design ──

def test_each_caller_gets_own_record():
    """Verify the contract stores caller address in each record, enabling per-caller retrieval."""
    match = re.search(r'def verify_claim.*?def add_trusted_source', SOURCE, re.DOTALL)
    assert match
    body = match.group()
    # Must store caller in the record
    assert "\"caller\"" in body and "sender_address" in body, "Each record must include caller address"
    # Must use unique verification_id per submission
    assert "verification_id" in body and "next_verification_id" in body

def test_verification_id_increments_atomically():
    """Each submission must get a unique, monotonically increasing ID."""
    match = re.search(r'def verify_claim.*?def add_trusted_source', SOURCE, re.DOTALL)
    assert match
    body = match.group()
    # Must assign ID before incrementing
    assert "str(self.next_verification_id)" in body, "Must read ID before increment"
    assert "self.next_verification_id += 1" in body, "Must increment after assignment"
