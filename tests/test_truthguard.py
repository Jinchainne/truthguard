"""
TruthGuard contract invariant tests.
Covers: consensus, verdicts, URL fetching, access control, storage.
"""
from pathlib import Path
import re

SOURCE = (Path(__file__).parents[1] / "contracts" / "truthguard.py").read_text()


def test_valid_syntax():
    import ast
    ast.parse(SOURCE)

# ── Consensus primitives ──

def test_uses_run_nondet_unsafe():
    assert "gl.vm.run_nondet_unsafe" in SOURCE

def test_uses_nondet_web_render():
    assert "gl.nondet.web.render" in SOURCE

def test_uses_exec_prompt():
    assert "gl.nondet.exec_prompt" in SOURCE

# ── Web fetch inside consensus ──

def test_fetch_inside_leader_fn():
    match = re.search(r'def leader_fn\(\).*?def validator_fn', SOURCE, re.DOTALL)
    assert match, "leader_fn not found"
    body = match.group()
    assert "_fetch_all" in body or "web.render" in body, "Must fetch URLs inside leader_fn"

def test_validator_re_runs_leader():
    match = re.search(r'def validator_fn.*?gl\.vm\.run_nondet_unsafe', SOURCE, re.DOTALL)
    assert match, "validator_fn not found"
    body = match.group()
    assert "leader_fn()" in body, "Validator must re-run leader_fn"

# ── Verdict handling ──

def test_three_verdicts():
    assert "SUPPORTED" in SOURCE
    assert "REFUTED" in SOURCE
    assert "UNVERIFIABLE" in SOURCE

def test_verdict_validation():
    assert "VALID_VERDICTS" in SOURCE

def test_consensus_checks_verdict():
    match = re.search(r'def validator_fn.*?gl\.vm\.run_nondet_unsafe', SOURCE, re.DOTALL)
    assert match
    body = match.group()
    assert "verdict" in body

def test_consensus_checks_confidence():
    match = re.search(r'def validator_fn.*?gl\.vm\.run_nondet_unsafe', SOURCE, re.DOTALL)
    assert match
    body = match.group()
    assert "confidence" in body

def test_consensus_checks_score():
    match = re.search(r'def validator_fn.*?gl\.vm\.run_nondet_unsafe', SOURCE, re.DOTALL)
    assert match
    body = match.group()
    assert "score" in body

# ── URL handling ──

def test_https_enforcement():
    assert "https://" in SOURCE

def test_url_length_limit():
    assert "MAX_URL_LEN" in SOURCE

def test_max_urls_limit():
    assert "MAX_URLS" in SOURCE

def test_fetch_limit():
    assert "MAX_FETCH_CHARS" in SOURCE

# ── Access control ──

def test_owner_only_functions():
    assert "_require_owner" in SOURCE
    assert "add_trusted_source" in SOURCE
    assert "remove_trusted_source" in SOURCE

def test_owner_set_in_constructor():
    match = re.search(r'def __init__\(self\):(.*?)def ', SOURCE, re.DOTALL)
    assert match
    body = match.group(1)
    assert "owner" in body and "sender_address" in body

# ── Storage ──

def test_treemap_storage():
    assert "TreeMap" in SOURCE

def test_dynarray_storage():
    assert "DynArray" in SOURCE

def test_extends_gl_contract():
    assert "gl.Contract" in SOURCE

def test_constructor_no_args():
    assert "def __init__(self):" in SOURCE

# ── View functions ──

def test_get_verification():
    assert "def get_verification" in SOURCE

def test_get_trusted_sources():
    assert "def get_trusted_sources" in SOURCE

def test_is_supported():
    assert "def is_supported" in SOURCE

def test_get_stats():
    assert "def get_stats" in SOURCE

# ── Prompt security ──

def test_untrusted_data_markers():
    assert "SECURITY RULES" in SOURCE or "untrusted" in SOURCE.lower()

def test_claim_length_limit():
    assert "MAX_CLAIM_LEN" in SOURCE

# ── Storage pattern ──

def test_verification_stored():
    match = re.search(r'def verify_claim.*?def add_trusted_source', SOURCE, re.DOTALL)
    assert match
    body = match.group()
    assert "self.verifications" in body

def test_returns_verification_id():
    match = re.search(r'def verify_claim.*?def add_trusted_source', SOURCE, re.DOTALL)
    assert match
    body = match.group()
    assert "verification_id" in body

# ── GenLayer features ──

def test_gl_message_sender():
    assert "gl.message.sender_address" in SOURCE

def test_gl_vm_user_error():
    assert "gl.vm.UserError" in SOURCE

def test_json_dumps():
    assert "json.dumps" in SOURCE

def test_json_loads():
    assert "json.loads" in SOURCE
