"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const CONTRACT = "0xE607Fb099B4d9Fc769e4C9aF101Eb0915Fd92EbC" as `0x${string}`;
const CHAIN_ID = 61999;
const CHAIN_HEX = "0xf22f";
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
  const [stats, setStats] = useState<Stats | null>(null);
  const [txHash, setTxHash] = useState("");
  const [loadErr, setLoadErr] = useState("");

  // Wallet connect
  async function connect() {
    if (!window.ethereum) { alert("Install MetaMask or OKX Wallet"); return; }
    try {
      const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWallet(accs[0]);
      const cid = parseInt(await window.ethereum.request({ method: "eth_chainId" }), 16);
      if (cid !== CHAIN_ID) {
        try {
          await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] });
        } catch (e: any) {
          if (e.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{ chainId: CHAIN_HEX, chainName: "GenLayer Studio Network", rpcUrls: [RPC_URL], nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 }, blockExplorerUrls: [EXPLORER] }],
            });
          }
        }
      }
      setChainOk(true);
    } catch (e: any) {
      setError(e.message);
    }
  }

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const client = createClient({ chain: studionet, endpoint: RPC_URL });
      const raw = await Promise.race([
        client.readContract({ address: CONTRACT, functionName: "get_stats", args: [] }),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 12000)),
      ]);
      const s = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (s && typeof s === "object") setStats(s as Stats);
    } catch (e: any) {
      setLoadErr(e.message?.slice(0, 100) || "Failed to load");
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Verify claim — uses genlayer-js writeContract through wallet provider
  async function handleVerify() {
    if (!claim.trim() || !urls.trim()) return;
    if (!wallet) { setError("Connect wallet first"); return; }
    setBusy(true); setError(""); setResult(null); setTxHash("");

    try {
      const client = createClient({
        chain: studionet,
        endpoint: RPC_URL,
        account: wallet as `0x${string}`,
        provider: window.ethereum as any,
      });

      const hash = await client.writeContract({
        address: CONTRACT,
        functionName: "verify_claim",
        args: [claim.trim(), urls.trim(), context.trim()],
        value: BigInt(0),
      });

      setTxHash(String(hash));

      // Wait for receipt
      await Promise.race([
        client.waitForTransactionReceipt({ hash: hash as any, status: "ACCEPTED" as any, retries: 60, interval: 3000 }),
        new Promise((_, rej) => setTimeout(() => rej(new Error("TX timeout")), 120000)),
      ]);

      // Read result after delay
      await new Promise(r => setTimeout(r, 5000));
      const lastId = (stats?.total_verifications ?? 0) + 1;
      try {
        const raw = await client.readContract({ address: CONTRACT, functionName: "get_verification", args: [String(lastId)] });
        const v = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (v && typeof v === "object") setResult(v as Verification);
      } catch {}

      loadStats();
    } catch (e: any) {
      const msg = e.message || "";
      if (msg.includes("user rejected") || msg.includes("user denied")) {
        setError("You cancelled the transaction.");
      } else if (msg.includes("rate limit")) {
        setError("Rate limited by StudioNet. Wait a moment and retry.");
      } else {
        setError(msg.slice(0, 200));
      }
    } finally {
      setBusy(false);
    }
  }

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
        {/* Hero with animated typewriter + orbital GIF */}
        <div className="hero-section">
          <div className="hero-bg">
            <img src="/node-2.gif" alt="" />
          </div>
          <div className="hero-content">
            <div className="glow-badge">GenLayer On-chain Oracle</div>
            <h1 className="typewriter-title">On-chain Fact Verification</h1>
            <p className="glow-subtitle">
              Verify factual claims against authoritative sources. TruthGuard fetches evidence on-chain,
              cross-references with AI, and produces a consensus-backed verdict: Supported, Refuted, or Unverifiable.
            </p>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-value">{stats?.total_verifications ?? 0}</div>
                <div className="hero-stat-label">Verifications</div>
              </div>
              <div>
                <div className="hero-stat-value">{stats?.trusted_sources_count ?? 0}</div>
                <div className="hero-stat-label">Trusted Sources</div>
              </div>
              <div>
                <div className="hero-stat-value">98</div>
                <div className="hero-stat-label">Accuracy Score</div>
              </div>
            </div>
          </div>
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
        {loadErr && <div className="alert alert-error" style={{ marginBottom: 16 }}>Stats: {loadErr}</div>}

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
            <button className="btn btn-primary" onClick={handleVerify} disabled={busy || !claim.trim() || !urls.trim() || !wallet}>
              {busy ? <><span className="spinner" /> Verifying…</> : !wallet ? "Connect Wallet First" : "Verify Claim"}
            </button>
            {error && <div className="alert alert-error">{error}</div>}
            {txHash && (
              <div className="alert alert-info">
                TX: <a href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>{short(txHash)}</a>
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
                    <a key={i} href={s} target="_blank" rel="noreferrer" className="badge" style={{ color: "var(--accent)", borderColor: "var(--accent)", textDecoration: "none" }}>{short(s)}</a>
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
            {[
              ["Submit claim + reference URLs", "You provide a factual claim and URLs to check against."],
              ["On-chain evidence fetching", "GenLayer validators fetch all URLs on-chain via gl.nondet.web.render()."],
              ["AI cross-references evidence", "Leader and validator independently analyze the claim against fetched content."],
              ["Consensus verdict stored on-chain", "SUPPORTED, REFUTED, or UNVERIFIABLE — with confidence, score, and audit trail."],
            ].map(([title, desc], i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent)", color: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                <div><p style={{ fontSize: 13, fontWeight: 600 }}>{title}</p><p style={{ fontSize: 12, color: "var(--text-dim)" }}>{desc}</p></div>
              </div>
            ))}
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
