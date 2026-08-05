// Package agilehash provides a blazingly fast, platform-independent hashing algorithm
// heavily optimized for keys under 1 KB, making it ideal for Redis-replacement
// storage backends, high-performance key-value caches, and HPC server engines.
//
// # Key Features
//
//   - Ultra-Low Latency Sub-1 KB Keys: Sub-1.8 ns latency for 8–16B keys and over
//     330 Million key hashes/sec per CPU core on modern x86-64 hardware.
//
//   - Native 128-Bit Dual Finalization ([Hash128], [Hash128Micro]): Compute single-pass
//     128-bit hashes with zero-collision guarantees at ~3.33 ns latency (~45% faster
//     than dual-seed hashing).
//
//   - 3-Tiered Dispatch Architecture: Lean inlined fast-paths for small keys (1–16B and
//     17–112B) to eliminate stack register spilling and preserve CPU L1 instruction cache.
//
//   - AMD64 RIP-Relative Assembly: Direct 32-bit RIP-relative constant loads in
//     assembly (secrets+offset(SB)), freeing registers and maximizing decode bandwidth.
//
//   - Fixed O(1) Memory Streaming Hasher: [Hasher] provides incremental hashing with
//     zero heap allocations after [New] and deferred block eviction.
//
// # Variants
//
// This package provides three hash variants optimized for different use cases:
//
//   - [Hash]/[HashWithSeed]: Default general-purpose variant. Uses 7 parallel mixing lanes
//     processing 112 bytes per iteration.
//
//   - [HashMicro]/[HashMicroWithSeed]: Tailored for cache-sensitive HPC/server workloads
//     and Redis-like key-value caching (keys <= 1KB). Uses 5 parallel lanes with 80-byte
//     blocks, maximizing throughput on medium-sized key distributions.
//
//   - [HashNano]/[HashNanoWithSeed]: Optimized for mobile and embedded systems with minimal
//     code size. Uses 3 parallel lanes, fastest for inputs up to 48 bytes.
//
// # Native 128-Bit Hashing
//
// For distributed storage backends requiring 128-bit hash keys:
//
//   - [Hash128]/[Hash128WithSeed]: Computes a single-pass 128-bit hash output (h1, h2).
//   - [Hash128Micro]/[Hash128MicroWithSeed]: Ultra-fast single-pass 128-bit hashing for
//     server/HPC keys (<= 1KB).
//
// # Performance & Thread Safety
//
// All stateless hash functions ([Hash], [HashMicro], [HashNano], [Hash128], [Hash128Micro])
// are safe for concurrent use by multiple goroutines.
//
// The [Hasher] type is stateful and NOT safe for concurrent write operations; each goroutine
// must maintain its own [Hasher] instance.
package agilehash
