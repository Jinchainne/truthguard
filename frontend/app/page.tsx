"use client";

import { useEffect, useState } from "react";

const CONTRACT = "0x83387908Ab9f92e98b3ab7E25b576CaDcC099CEe";
const CHAIN_ID = 61999;
const RPC_URL = "https://studio.genlayer.com/api";
const EXPLORER = "https://explorer-studio.genlayer.com";

type Verification = {
  id: string;
  claim: string;
  verdict: string;
  confidence: string;
  score: number;
  reason: string;
  sources_checked: string[];
  contradicting_sources: string[];
  caller: string;
};

type Stats = { owner: string; total_verifications: number; trusted_sources_count: number };

function short(a: string) { return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : ""; }

export default function Home() {
  const [wallet, setWallet] = useState<string>("");
  const [chainOk, setChainOk] = useState(false);
  const [claim, setClaim] = useState("");
  const [urls, setUrls] = useState("");
  const [context, setContext] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Verification | null>(null);
  const [history, setHistory] = useState<Verification[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [txHash, setTxHash] = useState("");

  // Wallet connect
  async function connect() {
    if (!window.ethereum) { alert("Install MetaMask or OKX Wallet"); return; }
    const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
    setWallet(accs[0]);
    const cid = parseInt(await window.ethereum.request({ method: "eth_chainId" }), 16);
    if (cid !== CHAIN_ID) {
      try {
        await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0xf22f" }] });
      } catch (e: any) {
        if (e.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{ chainId: "0xf22f", chainName: "GenLayer StudioNet", rpcUrls: [RPC_URL], nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 }, blockExplorerUrls: [EXPLORER] }],
          });
        }
      }
    }
    setChainOk(true);
  }

  // Verify claim
  async function handleVerify() {
    if (!claim.trim() || !urls.trim()) return;
    setBusy(true); setError(""); setResult(null); setTxHash("");
    try {
      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: Date.now(), method: "eth_sendTransaction",
          params: [{ from: wallet, to: CONTRACT, data: encodeVerifyClaim(claim, urls, context) }],
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
      setTxHash(json.result);
      // Wait and read result
      setTimeout(() => loadHistory(), 8000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function encodeVerifyClaim(c: string, u: string, ctx: string): string {
    // Simplified — in production use viem encodeFunctionData
    return "0x" + Buffer.from(JSON.stringify({ claim: c, urls: u, context: ctx })).toString("hex");
  }

  async function loadHistory() {
    // Load from contract — simplified for now
    try {
      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "gen_call", params: [{ type: "read", to: CONTRACT }] }),
      });
      const json = await res.json();
      // Parse verifications from response
    } catch {}
  }

  useEffect(() => { loadHistory(); }, []);

  return (
    <>
      {/* Header */}
      <header className="header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="logo">TruthGuard</span>
          <span className="badge badge-live">StudioNet</span>
        </div>
        <button className="btn btn-ghost" onClick={connect}>
          {wallet ? short(wallet) : "Connect Wallet"}
        </button>
      </header>

      <main className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        {/* Hero */}
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 12, letterSpacing: "-0.02em" }}>
            On-chain Fact Verification
          </h1>
          <p style={{ color: "var(--text-dim)", fontSize: 15, maxWidth: 600 }}>
            Verify factual claims against authoritative sources. TruthGuard fetches evidence on-chain,
            cross-references with AI, and produces a consensus-backed verdict: Supported, Refuted, or Unverifiable.
          </p>
        </div>

        {/* Stats */}
        <div className="stats">
          <div className="stat-box">
            <div className="stat-value">{stats?.total_verifications ?? 0}</div>
            <div className="stat-label">Verifications</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{stats?.trusted_sources_count ?? 0}</div>
            <div className="stat-label">Trusted Sources</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{short(CONTRACT)}</div>
            <div className="stat-label">Contract</div>
          </div>
        </div>

        {/* Verify Form */}
        <div className="card">
          <div className="card-title">Verify a Claim</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label>Claim to verify</label>
              <textarea
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                placeholder="e.g. Bitcoin was created by Satoshi Nakamoto in 2009"
                disabled={busy}
              />
            </div>
            <div>
              <label>Reference URLs (comma-separated)</label>
              <textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="https://en.wikipedia.org/wiki/Bitcoin, https://bitcoin.org/bitcoin.pdf"
                disabled={busy}
                style={{ minHeight: 60 }}
              />
            </div>
            <div>
              <label>Additional context (optional)</label>
              <input
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Any extra context for the verifier..."
                disabled={busy}
              />
            </div>
            <button className="btn btn-primary" onClick={handleVerify} disabled={busy || !claim.trim() || !urls.trim()}>
              {busy ? <><span className="spinner" /> Verifying…</> : "Verify Claim"}
            </button>
            {error && <div className="alert alert-error">{error}</div>}
            {txHash && (
              <div className="alert alert-info">
                TX submitted: <a href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>{short(txHash)}</a>
              </div>
            )}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="card">
            <div className="card-title">Verification Result</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <span className={`verdict verdict-${result.verdict.toLowerCase()}`}>
                {result.verdict === "SUPPORTED" ? "✓" : result.verdict === "REFUTED" ? "✗" : "?"} {result.verdict}
              </span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-dim)" }}>
                Confidence: {result.confidence} · Score: {result.score}/100
              </span>
            </div>
            <div className="score-bar" style={{ marginBottom: 16 }}>
              <div
                className="score-fill"
                style={{
                  width: `${result.score}%`,
                  background: result.verdict === "SUPPORTED" ? "var(--success)" : result.verdict === "REFUTED" ? "var(--error)" : "var(--warning)",
                }}
              />
            </div>
            <p style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 16 }}>{result.reason}</p>
            {result.sources_checked.length > 0 && (
              <div>
                <label>Sources checked</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {result.sources_checked.map((s, i) => (
                    <span key={i} className="badge" style={{ color: "var(--accent)", borderColor: "var(--accent)" }}>{short(s)}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* How it works */}
        <div className="card">
          <div className="card-title">How It Works</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent)", color: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>1</span>
              <div><p style={{ fontSize: 13, fontWeight: 600 }}>Submit claim + reference URLs</p><p style={{ fontSize: 12, color: "var(--text-dim)" }}>You provide a factual claim and URLs to check against.</p></div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent)", color: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>2</span>
              <div><p style={{ fontSize: 13, fontWeight: 600 }}>On-chain evidence fetching</p><p style={{ fontSize: 12, color: "var(--text-dim)" }}>GenLayer validators fetch all URLs on-chain via gl.nondet.web.render(). Trusted sources are also fetched.</p></div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent)", color: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>3</span>
              <div><p style={{ fontSize: 13, fontWeight: 600 }}>AI cross-references evidence</p><p style={{ fontSize: 12, color: "var(--text-dim)" }}>Leader and validator independently analyze the claim against fetched content. Must agree on verdict.</p></div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent)", color: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>4</span>
              <div><p style={{ fontSize: 13, fontWeight: 600 }}>Consensus verdict stored on-chain</p><p style={{ fontSize: 12, color: "var(--text-dim)" }}>SUPPORTED, REFUTED, or UNVERIFIABLE — with confidence, score, and audit trail.</p></div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <span>© 2026 TruthGuard · Built on GenLayer · StudioNet</span>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="https://github.com/Jinchainne/truthguard" target="_blank" rel="noreferrer">GitHub</a>
          <a href={EXPLORER} target="_blank" rel="noreferrer">Explorer</a>
          <a href="https://genlayer.com" target="_blank" rel="noreferrer">GenLayer</a>
        </div>
      </footer>
    </>
  );
}
