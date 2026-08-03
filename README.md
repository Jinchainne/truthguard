# TruthGuard

On-chain fact verification oracle for GenLayer. Verify factual claims against authoritative sources using AI consensus and on-chain evidence fetching.

**Live:** https://truthguard.vercel.app/  
**Contract:** `0x83387908Ab9f92e98b3ab7E25b576CaDcC099CEe` (StudioNet 61999)  
**Explorer:** https://explorer-studio.genlayer.com/address/0x83387908Ab9f92e98b3ab7E25b576CaDcC099CEe  
**Deploy TX:** https://explorer-studio.genlayer.com/tx/0x8ba34da0ae14d86e5b1607313723baeeb8e6b04b8a79c11f5ebf64780e276234

## How It Works

1. **Submit a claim** — Provide a factual claim and reference URLs to check against.
2. **On-chain fetching** — GenLayer validators fetch all URLs on-chain via `gl.nondet.web.render()`. Trusted sources are also fetched.
3. **AI cross-reference** — Leader and validator independently analyze the claim against fetched content. Must agree on verdict, confidence (±1 rank), and score (±20).
4. **Consensus verdict** — `SUPPORTED`, `REFUTED`, or `UNVERIFIABLE` stored on-chain with audit trail.

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

## Why GenLayer?

- **On-chain evidence fetching** — URLs are fetched inside the consensus path, not outside
- **Leader-validator consensus** — Both nodes independently verify, must agree on verdict
- **Immutable audit trail** — Every verification stored on-chain with sources, confidence, score
- **No single point of trust** — AI consensus removes human bias from fact-checking

## Frontend

Next.js + Tailwind CSS dark theme. Features:
- Claim verification form
- Verification result display (verdict, confidence, score bar)
- Verification history
- How it works guide
- Wallet connection (OKX / MetaMask)

## Tests

33 invariant tests covering:
- Consensus primitives (run_nondet_unsafe, web.render, exec_prompt)
- Web fetch inside consensus path
- Verdict handling (SUPPORTED/REFUTED/UNVERIFIABLE)
- URL validation and limits
- Access control (owner-only)
- Storage patterns
- View functions

```bash
python -m pytest tests/test_truthguard.py -v
```

## Project Structure

```
├── contracts/
│   └── truthguard.py           # Intelligent Contract
├── tests/
│   └── test_truthguard.py      # 33 invariant tests
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Main UI
│   │   ├── globals.css         # Dark theme
│   │   ├── layout.tsx
│   │   └── api/rpc/route.ts    # RPC proxy
│   └── package.json
├── .gitignore
└── README.md
```

## Author

- **Jinchainne** — [GitHub](https://github.com/Jinchainne)
