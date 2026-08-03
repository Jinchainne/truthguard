# TruthGuard

On-chain fact verification oracle for GenLayer. Verify factual claims against authoritative sources using AI consensus and on-chain evidence fetching.

**Live:** https://genlayer-truthguard.vercel.app/  
**Contract:** `0xE607Fb099B4d9Fc769e4C9aF101Eb0915Fd92EbC` (StudioNet 61999)  
**Explorer:** https://explorer-studio.genlayer.com/address/0xE607Fb099B4d9Fc769e4C9aF101Eb0915Fd92EbC  
**Deploy TX:** https://explorer-studio.genlayer.com/tx/0x9ca63e0661b9ecbc3fb9901649cced21ad74c3be454c520a6cf4b3c796a7b781

## How It Works

```
User submits claim + URLs → Contract fetches URLs on-chain → AI cross-references → Consensus verdict → Stored on-chain
```

1. **Submit a claim** — Provide a factual claim and reference URLs to check against.
2. **On-chain evidence fetching** — GenLayer validators fetch all URLs on-chain via `gl.nondet.web.render()`. Trusted sources are also fetched. Both leader and validator fetch independently.
3. **AI cross-reference** — Leader and validator independently analyze the claim against fetched content. The AI determines if the claim is SUPPORTED, REFUTED, or UNVERIFIABLE based on the actual evidence.
4. **Consensus verdict** — Leader and validator must agree on verdict (exact match), confidence (±1 rank), and score (±20 points). Result stored on-chain with full audit trail.

## Verified Example

A real on-chain verification demonstrated on the live app:

| Field | Value |
|-------|-------|
| **Claim** | "Bitcoin bắt đầu được Satoshi thiết kế từ 2007..." (Vietnamese Wikipedia) |
| **Reference URL** | https://vi.wikipedia.org/wiki/Bitcoin |
| **Verdict** | SUPPORTED |
| **Confidence** | high |
| **Score** | 98/100 |
| **Reasoning** | "The fetched content from the Vietnamese Wikipedia article on Bitcoin directly and verbatim confirms the claim" |
| **Sources checked** | vi.wikipedia.org/wiki/Bitcoin (fetched on-chain) |

The contract fetched the Wikipedia page on-chain, the AI compared the claim against the actual content, and the consensus verdict confirmed the claim is supported with 98% confidence.

## Contract Functions

### Write
| Function | Description |
|----------|-------------|
| `verify_claim(claim, urls_csv, context)` | Verify a claim against on-chain fetched sources |
| `add_trusted_source(url)` | Owner adds a trusted source URL |
| `remove_trusted_source(index)` | Owner removes a trusted source |

### View
| Function | Description |
|----------|-------------|
| `get_verification(id)` | Get verification result |
| `get_trusted_sources()` | List trusted sources |
| `get_stats()` | Total verifications, trusted sources count |
| `is_supported(id)` | Quick check if claim is supported |
| `get_version()` | Contract version |

## Contract Architecture

```python
class TruthGuard(gl.Contract):
    owner: str
    next_verification_id: u64
    trusted_sources: DynArray[str]
    verifications: TreeMap[str, str]

    def verify_claim(self, claim, reference_urls_csv, context="") -> str:
        # 1. Snapshot inputs before consensus
        # 2. leader_fn() fetches ALL URLs inside consensus via gl.nondet.web.render()
        # 3. AI cross-references claim against fetched content
        # 4. validator_fn() re-runs leader_fn() independently
        # 5. gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        # 6. Store verification on-chain with verdict, confidence, score, reason
```

Key patterns:
- **Web fetch INSIDE consensus** — `_fetch_all()` called inside `leader_fn()`, not outside
- **Leader-validator consensus** — Both nodes independently fetch + analyze
- **Verdict validation** — Must agree on verdict (exact), confidence (±1 rank), score (±20)
- **No-arg constructor** — Uses defaults (platform_name, rules_uri)
- **Owner-only admin** — `add_trusted_source` / `remove_trusted_source` restricted

## Why GenLayer?

This project **cannot work without GenLayer**:
- **On-chain evidence fetching** — URLs are fetched inside the consensus path, not outside. Both leader and validator fetch independently.
- **Leader-validator consensus** — Two independent AI evaluations must agree on the verdict. No single point of trust.
- **Immutable audit trail** — Every verification stored on-chain with sources checked, contradicting sources, confidence, and score.
- **No single point of trust** — AI consensus removes human bias from fact-checking.

## Frontend

Next.js + Tailwind CSS dark theme. Features:
- Claim verification form with claim, reference URLs, and optional context
- Verification result display (verdict, confidence, score bar)
- Wallet connection (OKX / MetaMask) via `window.ethereum`
- Chain switching to StudioNet (0xf22f / 61999)
- RPC proxy (`/api/rpc`) for CORS bypass
- How it works guide (4-step process)

## Tests

33 invariant tests covering:
- Consensus primitives (`run_nondet_unsafe`, `web.render`, `exec_prompt`)
- Web fetch inside consensus path (leader_fn contains `_fetch_all`)
- Verdict handling (SUPPORTED/REFUTED/UNVERIFIABLE)
- URL validation and limits (MAX_URL_LEN, MAX_URLS, MAX_FETCH_CHARS)
- Access control (owner-only functions)
- Storage patterns (TreeMap, DynArray, auto-initialization)
- View functions (get_verification, get_stats, is_supported)

```bash
python -m pytest tests/test_truthguard.py -v
```

## Quick Start

```bash
# Deploy contract
genlayer deploy --contract contracts/truthguard.py

# Run frontend
cd frontend && npm install && npm run dev

# Run tests
python -m pytest tests/test_truthguard.py -v
```

## Project Structure

```
├── contracts/
│   └── truthguard.py           # Intelligent Contract (230 lines)
├── tests/
│   └── test_truthguard.py      # 33 invariant tests
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Main UI with wallet + verification
│   │   ├── globals.css         # Dark theme
│   │   ├── layout.tsx
│   │   └── api/rpc/route.ts    # RPC proxy for CORS
│   └── package.json
├── .gitignore
└── README.md
```

## Author

- **Jinchainne** — [GitHub](https://github.com/Jinchainne)
