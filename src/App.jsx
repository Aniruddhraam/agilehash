import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./App.css";

/* ═══════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════ */

const features = [
	{
		icon: (
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
				<path d="M9 12l2 2 4-4" />
			</svg>
		),
		title: "Certified Quality",
		subtitle: "100% SMHasher3 Pass Grade",
		description:
			"Perfect pass grade across all differential, avalanche, and collision tests — outperforming XXH3, Wyhash, MurmurHash3, and CityHash.",
	},
	{
		icon: (
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
			</svg>
		),
		title: "Ultra-Fast Mixing",
		subtitle: "64×64→128-Bit Multiplication",
		description:
			"Single-instruction 64×64→128-bit unsigned multiplication extracts maximum differential entropy per CPU cycle.",
	},
	{
		icon: (
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<line x1="6" y1="3" x2="6" y2="15" />
				<circle cx="18" cy="6" r="3" />
				<circle cx="6" cy="18" r="3" />
				<path d="M18 9a9 9 0 0 1-9 9" />
			</svg>
		),
		title: "Branchless Evaluation",
		subtitle: "Sub-1.8 ns Small-Key Path",
		description:
			"Small inputs (≤16 B) execute in a lean branchless path, achieving sub-1.8 ns latency with zero branches.",
	},
	{
		icon: (
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<circle cx="12" cy="12" r="10" />
				<line x1="2" y1="12" x2="22" y2="12" />
				<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
			</svg>
		),
		title: "Endian Neutral",
		subtitle: "Cross-Platform Consistency",
		description:
			"Identical 64-bit and 128-bit hash outputs across big-endian and little-endian systems with unaligned memory access.",
	},
];

const differences = [
	{
		tag: "Architecture",
		title: "3-Tiered Dispatch",
		description:
			"Keeps small (1–16 B) and medium (17–112 B) keys inlined and leaf-like, preventing register spilling and L1 instruction cache pollution.",
	},
	{
		tag: "128-Bit",
		title: "Native Dual Finalization",
		description:
			"Dual 64-bit outputs from the internal mum() 128-bit multiply using orthogonal secret constants. Single-pass at 3.33 ns — ~45% faster than dual-seed hashing.",
	},
	{
		tag: "Assembly",
		title: "AMD64 RIP-Relative",
		description:
			"Direct 32-bit RIP-relative constant loads in x86-64 assembly, freeing R14 pointer base registers and maximizing instruction decode bandwidth.",
	},
	{
		tag: "Streaming",
		title: "O(1) Memory Hasher",
		description:
			"Redesigned stateful Hasher with 0 heap allocations after New() and deferred block eviction, eliminating per-chunk copy loops.",
	},
	{
		tag: "Tuning",
		title: "Sub-1 KB Key Optimized",
		description:
			"Specifically engineered for key-value server workloads (≤1 KB), delivering peak throughput where key lookups occur millions of times per second.",
	},
];

const codeExamples = [
	{
		id: "basic",
		label: "Basic",
		code: `package main

import (
    "fmt"
    "github.com/Aniruddhraam/agilehash"
)

func main() {
    data := []byte("hello world")

    // Default seed (0)
    hash := agilehash.Hash(data)
    fmt.Printf("Hash: 0x%x\\n", hash)

    // Custom seed
    hash = agilehash.HashWithSeed(data, 12345)
    fmt.Printf("Hash with seed: 0x%x\\n", hash)
}`,
	},
	{
		id: "variants",
		label: "Variants",
		code: `// Small inputs (<=48 bytes) — fastest for embedded/mobile
nano := agilehash.HashNano([]byte("key"))
fmt.Printf("Nano: 0x%x\\n", nano)

// Medium inputs (<=512 bytes) — optimized for HPC/server & Redis keys
micro := agilehash.HashMicro([]byte("medium data"))
fmt.Printf("Micro: 0x%x\\n", micro)

// Large inputs (>512 bytes) — general purpose
large := agilehash.Hash([]byte("large input data..."))
fmt.Printf("Large: 0x%x\\n", large)`,
	},
	{
		id: "hash128",
		label: "128-Bit",
		code: `// Native dual finalization — ultra-fast single pass
h1, h2 := agilehash.Hash128([]byte("redis:user:100452"))
fmt.Printf("128-bit Hash: 0x%016x%016x\\n", h1, h2)

// Micro variant for server/HPC 128-bit keys (<=1KB)
m1, m2 := agilehash.Hash128Micro([]byte("redis:user:100452"))
fmt.Printf("128-bit Micro Hash: 0x%016x%016x\\n", m1, m2)`,
	},
	{
		id: "streaming",
		label: "Streaming",
		code: `// Incremental hashing
hasher := agilehash.New()
hasher.Write([]byte("hello "))
hasher.Write([]byte("world"))
hash := hasher.Sum64()
fmt.Printf("Streaming hash: 0x%x\\n", hash)

// Reset and reuse (zero allocation)
hasher.Reset()
hasher.Write([]byte("new data"))
hash = hasher.Sum64()`,
	},
];

const MAX_THROUGHPUT = 37532;

const perfData = [
	{ size: "8 B", variant: "Hash", latency: "1.76 ns", throughput: 4534, gbps: "4.5" },
	{ size: "16 B", variant: "Hash", latency: "1.77 ns", throughput: 9025, gbps: "9.0" },
	{ size: "32 B", variant: "Nano", latency: "2.56 ns", throughput: 12492, gbps: "12.5" },
	{ size: "64 B", variant: "Micro", latency: "3.03 ns", throughput: 21127, gbps: "21.1" },
	{ size: "128 B", variant: "Micro", latency: "5.48 ns", throughput: 23341, gbps: "23.3" },
	{ size: "256 B", variant: "Micro", latency: "9.15 ns", throughput: 27969, gbps: "28.0" },
	{ size: "512 B", variant: "Micro", latency: "16.3 ns", throughput: 31354, gbps: "31.4" },
	{ size: "1 KB", variant: "Hash", latency: "30.4 ns", throughput: 33694, gbps: "33.7" },
	{ size: "4 KB", variant: "Hash", latency: "112 ns", throughput: 36484, gbps: "36.5" },
	{ size: "8 KB", variant: "Hash", latency: "218 ns", throughput: 37532, gbps: "37.5" },
];

const benchmarkRows = [
	{ size: 8, variant: "Hash", iters: "668,326,960", nsOp: "1.764", mbS: "4,534", allocs: "0" },
	{ size: 8, variant: "Hasher", iters: "215,850,195", nsOp: "5.498", mbS: "1,455", allocs: "0" },
	{
		size: 8,
		variant: "HashNano",
		iters: "604,078,540",
		nsOp: "1.888",
		mbS: "4,237",
		allocs: "0",
	},
	{ size: 16, variant: "Hash", iters: "675,036,769", nsOp: "1.773", mbS: "9,025", allocs: "0" },
	{ size: 16, variant: "Hasher", iters: "204,277,476", nsOp: "5.807", mbS: "2,755", allocs: "0" },
	{
		size: 16,
		variant: "HashNano",
		iters: "644,393,599",
		nsOp: "1.883",
		mbS: "8,499",
		allocs: "0",
	},
	{ size: 32, variant: "Hash", iters: "433,411,077", nsOp: "2.748", mbS: "11,647", allocs: "0" },
	{ size: 32, variant: "Hasher", iters: "179,852,575", nsOp: "6.592", mbS: "4,854", allocs: "0" },
	{
		size: 32,
		variant: "HashNano",
		iters: "462,663,864",
		nsOp: "2.562",
		mbS: "12,492",
		allocs: "0",
	},
	{ size: 64, variant: "Hash", iters: "373,252,473", nsOp: "3.120", mbS: "20,510", allocs: "0" },
	{ size: 64, variant: "Hasher", iters: "150,926,852", nsOp: "8.097", mbS: "7,904", allocs: "0" },
	{
		size: 64,
		variant: "HashMicro",
		iters: "374,783,730",
		nsOp: "3.029",
		mbS: "21,127",
		allocs: "0",
	},
	{ size: 128, variant: "Hash", iters: "151,290,862", nsOp: "7.979", mbS: "16,042", allocs: "0" },
	{
		size: 128,
		variant: "Hasher",
		iters: "86,484,703",
		nsOp: "12.75",
		mbS: "10,037",
		allocs: "0",
	},
	{
		size: 128,
		variant: "HashMicro",
		iters: "223,672,537",
		nsOp: "5.484",
		mbS: "23,341",
		allocs: "0",
	},
	{ size: 256, variant: "Hash", iters: "92,641,149", nsOp: "11.06", mbS: "23,156", allocs: "0" },
	{
		size: 256,
		variant: "Hasher",
		iters: "76,747,683",
		nsOp: "15.61",
		mbS: "16,397",
		allocs: "0",
	},
	{
		size: 256,
		variant: "HashMicro",
		iters: "129,079,030",
		nsOp: "9.153",
		mbS: "27,969",
		allocs: "0",
	},
	{ size: 512, variant: "Hash", iters: "70,918,502", nsOp: "16.89", mbS: "30,314", allocs: "0" },
	{
		size: 512,
		variant: "Hasher",
		iters: "56,575,167",
		nsOp: "20.98",
		mbS: "24,402",
		allocs: "0",
	},
	{
		size: 512,
		variant: "HashMicro",
		iters: "65,453,450",
		nsOp: "16.33",
		mbS: "31,354",
		allocs: "0",
	},
	{ size: 1024, variant: "Hash", iters: "34,991,355", nsOp: "30.39", mbS: "33,694", allocs: "0" },
	{
		size: 1024,
		variant: "Hasher",
		iters: "32,216,328",
		nsOp: "34.31",
		mbS: "29,848",
		allocs: "0",
	},
	{ size: 4096, variant: "Hash", iters: "10,000,365", nsOp: "112.3", mbS: "36,484", allocs: "0" },
	{
		size: 4096,
		variant: "Hasher",
		iters: "9,967,412",
		nsOp: "119.1",
		mbS: "34,380",
		allocs: "0",
	},
	{ size: 8192, variant: "Hash", iters: "5,433,234", nsOp: "218.3", mbS: "37,532", allocs: "0" },
	{
		size: 8192,
		variant: "Hasher",
		iters: "5,368,254",
		nsOp: "220.3",
		mbS: "37,191",
		allocs: "0",
	},
];

const comparableRows = [
	{ type: "int", nsOp: "21.26", bOp: "8", allocs: "1" },
	{ type: "uint64", nsOp: "21.81", bOp: "8", allocs: "1" },
	{ type: "string", nsOp: "30.71", bOp: "16", allocs: "1" },
	{ type: "bool", nsOp: "14.18", bOp: "0", allocs: "0" },
	{ type: "uintptr", nsOp: "22.60", bOp: "8", allocs: "1" },
	{ type: "ptr", nsOp: "15.28", bOp: "0", allocs: "0" },
	{ type: "ptr-nil", nsOp: "15.15", bOp: "0", allocs: "0" },
	{ type: "array", nsOp: "67.64", bOp: "16", allocs: "1" },
	{ type: "struct", nsOp: "107.1", bOp: "32", allocs: "1" },
];

const constants = [
	{ name: "DefaultSeed", description: "Default 64-bit seed value (0)" },
	{
		name: "Secret0–Secret7",
		description: "Precomputed 64-bit secret constants for maximum avalanche distribution",
	},
	{
		name: "DefaultBlockSize",
		description: "Default 112-byte block size used by the streaming Hasher",
	},
];

/* ═══════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════ */

function Nav() {
	return (
		<nav className="nav">
			<div className="nav-inner">
				<a href="#" className="nav-brand">
					<img
						src={`${import.meta.env.BASE_URL}favicon.svg`}
						alt=""
						className="nav-logo"
					/>
					<span className="nav-name">agilehash</span>
				</a>
				<div className="nav-links">
					<a href="#features">Features</a>
					<a href="#usage">Usage</a>
					<a href="#performance">Performance</a>
					<a
						href="https://pkg.go.dev/github.com/Aniruddhraam/agilehash"
						target="_blank"
						rel="noopener noreferrer"
					>
						Docs
					</a>
					<a
						href="https://github.com/Aniruddhraam/agilehash"
						target="_blank"
						rel="noopener noreferrer"
						className="nav-gh"
					>
						<svg viewBox="0 0 16 16" fill="currentColor" width="18" height="18">
							<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
						</svg>
					</a>
				</div>
			</div>
		</nav>
	);
}

function Hero() {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText("go get github.com/Aniruddhraam/agilehash");
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<section className="hero">
			<div className="hero-glow" />
			<div className="hero-content">
				<div className="hero-badge">
					<span className="hero-badge-dot" />
					100% SMHasher3 Pass — Zero Collision Anomalies
				</div>

				<h1 className="hero-title">agilehash</h1>
				<p className="hero-subtitle">
					High-performance Go implementation of the agilehash V3 algorithm, optimized for
					sub-1&nbsp;KB keys in Redis-replacement storage backends, high-throughput
					key-value caches, and HPC server engines.
				</p>

				<div className="hero-install">
					<span className="hero-install-prefix">$</span>
					<code>go get github.com/Aniruddhraam/agilehash</code>
					<button
						onClick={handleCopy}
						className="hero-copy-btn"
						title="Copy to clipboard"
					>
						{copied ? (
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								width="16"
								height="16"
							>
								<path d="M20 6L9 17l-5-5" />
							</svg>
						) : (
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								width="16"
								height="16"
							>
								<rect x="9" y="9" width="13" height="13" rx="2" />
								<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
							</svg>
						)}
					</button>
				</div>

				<div className="hero-actions">
					<a
						href="https://pkg.go.dev/github.com/Aniruddhraam/agilehash"
						className="btn btn-primary"
						target="_blank"
						rel="noopener noreferrer"
					>
						API Documentation
					</a>
					<a
						href="https://github.com/Aniruddhraam/agilehash"
						className="btn btn-outline"
						target="_blank"
						rel="noopener noreferrer"
					>
						View on GitHub
					</a>
				</div>

				<a
					href="https://pkg.go.dev/github.com/Aniruddhraam/agilehash"
					target="_blank"
					rel="noopener noreferrer"
					className="hero-go-badge"
				>
					<img
						src="https://pkg.go.dev/badge/github.com/Aniruddhraam/agilehash.svg"
						alt="Go Reference"
					/>
				</a>
			</div>
		</section>
	);
}

function Stats() {
	return (
		<section className="stats">
			<div className="stats-grid">
				<div className="stat">
					<span className="stat-value">
						1.76<span className="stat-unit">ns</span>
					</span>
					<span className="stat-label">Small-Key Latency</span>
				</div>
				<div className="stat">
					<span className="stat-value">
						37.5<span className="stat-unit">GB/s</span>
					</span>
					<span className="stat-label">Peak Throughput</span>
				</div>
				<div className="stat">
					<span className="stat-value">
						0<span className="stat-unit">allocs</span>
					</span>
					<span className="stat-label">Heap Allocations</span>
				</div>
				<div className="stat">
					<span className="stat-value">
						100<span className="stat-unit">%</span>
					</span>
					<span className="stat-label">SMHasher3 Tests Passed</span>
				</div>
			</div>
		</section>
	);
}

function Features() {
	return (
		<section className="section" id="features">
			<div className="section-inner">
				<h2 className="section-title">Inherited Core Strengths</h2>
				<p className="section-subtitle">
					Built on proven foundations, every aspect is engineered for maximum hash quality
					and throughput.
				</p>
				<div className="features-grid">
					{features.map((f) => (
						<div className="feature-card" key={f.title}>
							<div className="feature-icon">{f.icon}</div>
							<h3 className="feature-title">{f.title}</h3>
							<p className="feature-subtitle">{f.subtitle}</p>
							<p className="feature-desc">{f.description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function Differences() {
	return (
		<section className="section section-alt">
			<div className="section-inner">
				<h2 className="section-title">What Sets agilehash Apart</h2>
				<p className="section-subtitle">
					Key engineering differences from the original rapidhash that make agilehash
					purpose-built for server workloads.
				</p>
				<div className="diff-list">
					{differences.map((d, i) => (
						<div className="diff-item" key={i}>
							<div className="diff-number">{String(i + 1).padStart(2, "0")}</div>
							<div className="diff-body">
								<div className="diff-header">
									<span className="diff-tag">{d.tag}</span>
									<h3 className="diff-title">{d.title}</h3>
								</div>
								<p className="diff-desc">{d.description}</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function CodeExamples() {
	const [active, setActive] = useState("basic");
	const current = codeExamples.find((e) => e.id === active);

	return (
		<section className="section" id="usage">
			<div className="section-inner">
				<h2 className="section-title">Quick Start</h2>
				<p className="section-subtitle">
					Install with <code className="inline-code">go get</code> and start hashing in
					seconds. Choose the right variant for your workload.
				</p>

				<div className="code-panel">
					<div className="code-tabs">
						{codeExamples.map((e) => (
							<button
								key={e.id}
								className={`code-tab ${active === e.id ? "active" : ""}`}
								onClick={() => setActive(e.id)}
							>
								{e.label}
							</button>
						))}
					</div>
					<div className="code-block">
						<SyntaxHighlighter
							language="go"
							style={oneDark}
							customStyle={{
								margin: 0,
								borderRadius: "0 0 12px 12px",
								fontSize: "14px",
								padding: "1.5rem",
							}}
							showLineNumbers
						>
							{current.code}
						</SyntaxHighlighter>
					</div>
				</div>
			</div>
		</section>
	);
}

function Performance() {
	const [showBench, setShowBench] = useState(false);

	return (
		<section className="section section-alt" id="performance">
			<div className="section-inner">
				<h2 className="section-title">Performance</h2>
				<p className="section-subtitle">
					Benchmarked on Intel Core Ultra 9 185H &middot; Linux amd64 &middot;{" "}
					<code className="inline-code">go test -bench=. -benchmem</code>
				</p>

				{/* ── Throughput Chart ── */}
				<div className="perf-chart">
					<div className="perf-chart-header">
						<span>Key Size</span>
						<span>Throughput (best variant)</span>
						<span>Latency</span>
					</div>
					{perfData.map((d) => (
						<div className="perf-row" key={d.size}>
							<span className="perf-size">{d.size}</span>
							<div className="perf-bar-track">
								<div
									className="perf-bar"
									style={{ width: `${(d.throughput / MAX_THROUGHPUT) * 100}%` }}
								>
									<span className="perf-bar-label">{d.gbps} GB/s</span>
								</div>
							</div>
							<span className="perf-latency">{d.latency}</span>
						</div>
					))}
				</div>

				{/* ── Benchmark Toggle ── */}
				<button className="bench-toggle" onClick={() => setShowBench(!showBench)}>
					{showBench ? "▾ Hide" : "▸ Show"} Full Benchmark Results
				</button>

				{showBench && (
					<div className="bench-section">
						{/* Compute Benchmarks */}
						<h3 className="bench-heading">Compute Benchmarks</h3>
						<div className="bench-table-wrapper">
							<table className="bench-table">
								<thead>
									<tr>
										<th>Size</th>
										<th>Variant</th>
										<th>Iterations</th>
										<th>ns/op</th>
										<th>MB/s</th>
										<th>allocs/op</th>
									</tr>
								</thead>
								<tbody>
									{benchmarkRows.map((r, i) => (
										<tr
											key={i}
											className={r.variant === "Hasher" ? "row-dim" : ""}
										>
											<td className="cell-mono">
												{r.size >= 1024
													? `${r.size / 1024} KB`
													: `${r.size} B`}
											</td>
											<td>
												<span
													className={`variant-badge variant-${r.variant.toLowerCase()}`}
												>
													{r.variant}
												</span>
											</td>
											<td className="cell-mono">{r.iters}</td>
											<td className="cell-mono">{r.nsOp}</td>
											<td className="cell-mono cell-highlight">{r.mbS}</td>
											<td className="cell-mono">{r.allocs}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Comparable Benchmarks */}
						<h3 className="bench-heading">Comparable Type Benchmarks</h3>
						<div className="bench-table-wrapper">
							<table className="bench-table">
								<thead>
									<tr>
										<th>Type</th>
										<th>ns/op</th>
										<th>B/op</th>
										<th>allocs/op</th>
									</tr>
								</thead>
								<tbody>
									{comparableRows.map((r, i) => (
										<tr key={i}>
											<td>
												<code className="inline-code">{r.type}</code>
											</td>
											<td className="cell-mono">{r.nsOp}</td>
											<td className="cell-mono">{r.bOp}</td>
											<td className="cell-mono">{r.allocs}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<p className="bench-note">
							Streaming chunked (1 KB): <strong>65.53 ns/op</strong> at 15,625 MB/s
							&middot; All tests <strong>PASS</strong> in 54.812s
						</p>
					</div>
				)}
			</div>
		</section>
	);
}

function ApiDetails() {
	return (
		<section className="section">
			<div className="section-inner">
				<div className="api-grid">
					<div>
						<h2 className="section-title" style={{ textAlign: "left" }}>
							Exported Constants
						</h2>
						<div className="const-list">
							{constants.map((c) => (
								<div className="const-item" key={c.name}>
									<code className="inline-code">{c.name}</code>
									<span>{c.description}</span>
								</div>
							))}
						</div>
					</div>
					<div>
						<h2 className="section-title" style={{ textAlign: "left" }}>
							Thread Safety
						</h2>
						<div className="safety-cards">
							<div className="safety-card safety-safe">
								<div className="safety-indicator">✓ Safe</div>
								<p>
									All hash functions (<code className="inline-code">Hash</code>,{" "}
									<code className="inline-code">HashMicro</code>,{" "}
									<code className="inline-code">HashNano</code>,{" "}
									<code className="inline-code">Hash128</code>,{" "}
									<code className="inline-code">Hash128Micro</code>) are safe for
									concurrent use across goroutines.
								</p>
							</div>
							<div className="safety-card safety-caution">
								<div className="safety-indicator">⚠ Per-Goroutine</div>
								<p>
									<code className="inline-code">Hasher</code> instances are{" "}
									<strong>not</strong> safe for concurrent write operations — use
									one instance per goroutine.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function Footer() {
	return (
		<footer className="footer">
			<div className="footer-inner">
				<div className="footer-brand">
					<img
						src={`${import.meta.env.BASE_URL}favicon.svg`}
						alt=""
						width="24"
						height="24"
					/>
					<span>agilehash</span>
				</div>
				<p className="footer-copy">Apache 2.0 License</p>
				<div className="footer-links">
					<a
						href="https://pkg.go.dev/github.com/Aniruddhraam/agilehash"
						target="_blank"
						rel="noopener noreferrer"
					>
						Docs
					</a>
					<a
						href="https://github.com/Aniruddhraam/agilehash"
						target="_blank"
						rel="noopener noreferrer"
					>
						GitHub
					</a>
				</div>
			</div>
		</footer>
	);
}

/* ═══════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════ */

function App() {
	return (
		<>
			<Nav />
			<Hero />
			<Stats />
			<Features />
			<Differences />
			<CodeExamples />
			<Performance />
			<ApiDetails />
			<Footer />
		</>
	);
}

export default App;
