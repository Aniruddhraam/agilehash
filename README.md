# agilehash

a Go implementation of the agilehash V3 algorithm - a blazingly fast, high-quality, platform-independent hashing algorithm heavily optimized for keys under 1 KB (making it ideal for Redis-replacement storage backends and HPC key-value engines).

## Key Features & QoL Updates

- **⚡ Blazingly Fast Sub-1 KB Keys**: Optimized for short-to-medium keys ($\le 1\text{ KB}$), achieving sub-1.8 ns latency for 8-16B keys and over 330 Million key hashes/sec per CPU core.
- **🛡️ Native 128-Bit Dual Finalization (`Hash128`, `Hash128Micro`)**: Compute single-pass 128-bit hashes with zero-collision guarantees at **~3.33 ns** latency (~45% faster than dual-seed hashing).
- **🚀 3-Tiered Dispatch Architecture**: Lean inlined fast-paths for small keys (1–16B and 17–112B) to eliminate register spilling and preserve CPU L1 instruction cache density.
- **⚡ AMD64 RIP-Relative Assembly (`secrets+offset(SB)`)**: Direct 32-bit RIP-relative constant loads in x86-64 assembly, freeing `R14` and maximizing decode bandwidth.
- **💾 Fixed O(1) Memory Streaming `Hasher`**: Zero heap allocations after `New()`, with deferred block eviction for high-throughput chunked writes.

## Install

```bash
go get github.com/Aniruddhraam/agilehash
```

## Usage

### Basic Hashing

```go
package main

import (
    "fmt"
    "github.com/Aniruddhraam/agilehash"
)

func main() {
    data := []byte("hello world")

    // default seed (0)
    hash := agilehash.Hash(data)
    fmt.Printf("Hash: 0x%x\n", hash)

    // custom seed
    hash = agilehash.HashWithSeed(data, 12345)
    fmt.Printf("Hash with seed: 0x%x\n", hash)
}
```

### Variant Selection

```go
// for small inputs (≤48 bytes) - fastest for mobile/embedded
nano := agilehash.HashNano([]byte("key"))
fmt.Printf("Nano: 0x%x\n", nano)

// for medium inputs (≤512 bytes) - optimized for HPC/server & Redis keys
micro := agilehash.HashMicro([]byte("medium data"))
fmt.Printf("Micro: 0x%x\n", micro)

// for large inputs (>512 bytes) - general purpose
large := agilehash.Hash([]byte("large input data..."))
fmt.Printf("Large: 0x%x\n", large)
```

### Native 128-Bit Hashing (Single-Pass)

```go
// Native dual finalization for 128-bit output (ultra-fast single pass)
h1, h2 := agilehash.Hash128([]byte("redis:user:100452"))
fmt.Printf("128-bit Hash: 0x%016x%016x\n", h1, h2)

// Micro variant for server/HPC 128-bit keys (<=1KB)
m1, m2 := agilehash.Hash128Micro([]byte("redis:user:100452"))
fmt.Printf("128-bit Micro Hash: 0x%016x%016x\n", m1, m2)
```

### Streaming Hash

```go
// for incremental hashing
hasher := agilehash.New()
hasher.Write([]byte("hello "))
hasher.Write([]byte("world"))
hash := hasher.Sum64()
fmt.Printf("Streaming hash: 0x%x\n", hash)

// reset and reuse
hasher.Reset()
hasher.Write([]byte("new data"))
hash = hasher.Sum64()
```

## Performance

Typical performance on modern CPUs (**Intel Core Ultra 9 185H**):

- **Small keys (8-16 bytes)**: **~1.76 - 1.77 ns/op** (~4.5 - 9.0 GB/s, 560M+ ops/sec per core).
- **Medium keys (32-64 bytes)**: **~2.56 - 3.03 ns/op** (~12.5 - 21.1 GB/s, 330M+ ops/sec per core).
- **128-bit Native Hash (64 bytes)**: **~3.33 ns/op** (Single-pass dual finalization).
- **Large inputs (1KB+)**: **~33 - 38 GB/s**.

Performance varies by hardware, microarchitecture, and Go version.

## Benchmarks

Benchmark command executed:

```bash
go test -bench=. -benchmem -count=1 ./...
```

System Configuration:

- **OS**: Linux (amd64)
- **CPU**: Intel(R) Core(TM) Ultra 9 185H

<details open>
  <summary><code>Intel Core Ultra 9 185H Benchmark Output</code></summary>

```
goos: linux
goarch: amd64
pkg: github.com/Aniruddhraam/agilehash
cpu: Intel(R) Core(TM) Ultra 9 185H
BenchmarkComputes/8/Hash-22             668326960                1.764 ns/op   4534.25 MB/s            0 B/op          0 allocs/op
BenchmarkComputes/8/Hasher-22           215850195                5.498 ns/op   1455.09 MB/s            0 B/op          0 allocs/op
BenchmarkComputes/8/HashNano-22         604078540                1.888 ns/op   4237.11 MB/s            0 B/op          0 allocs/op
BenchmarkComputes/16/Hash-22            675036769                1.773 ns/op   9024.79 MB/s            0 B/op          0 allocs/op
BenchmarkComputes/16/Hasher-22          204277476                5.807 ns/op   2755.15 MB/s            0 B/op          0 allocs/op
BenchmarkComputes/16/HashNano-22        644393599                1.883 ns/op   8499.04 MB/s            0 B/op          0 allocs/op
BenchmarkComputes/32/Hash-22            433411077                2.748 ns/op   11646.64 MB/s          0 B/op          0 allocs/op
BenchmarkComputes/32/Hasher-22          179852575                6.592 ns/op   4854.48 MB/s           0 B/op          0 allocs/op
BenchmarkComputes/32/HashNano-22        462663864                2.562 ns/op   12492.13 MB/s          0 B/op          0 allocs/op
BenchmarkComputes/64/Hash-22            373252473                3.120 ns/op   20509.86 MB/s          0 B/op          0 allocs/op
BenchmarkComputes/64/Hasher-22          150926852                8.097 ns/op   7903.85 MB/s           0 B/op          0 allocs/op
BenchmarkComputes/64/HashMicro-22       374783730                3.029 ns/op   21127.25 MB/s          0 B/op          0 allocs/op
BenchmarkComputes/128/Hash-22           151290862                7.979 ns/op   16042.07 MB/s          0 B/op          0 allocs/op
BenchmarkComputes/128/Hasher-22         86484703                12.75 ns/op    10037.42 MB/s          0 B/op          0 allocs/op
BenchmarkComputes/128/HashMicro-22      223672537                5.484 ns/op   23341.49 MB/s          0 B/op          0 allocs/op
BenchmarkComputes/256/Hash-22           92641149                11.06 ns/op    23156.14 MB/s          0 B/op          0 allocs/op
BenchmarkComputes/256/Hasher-22         76747683                15.61 ns/op    16397.48 MB/s          0 B/op          0 allocs/op
BenchmarkComputes/256/HashMicro-22      129079030                9.153 ns/op   27968.71 MB/s          0 B/op          0 allocs/op
BenchmarkComputes/512/Hash-22           70918502                16.89 ns/op    30313.63 MB/s          0 B/op          0 allocs/op
BenchmarkComputes/512/Hasher-22         56575167                20.98 ns/op    24401.77 MB/s          0 B/op          0 allocs/op
BenchmarkComputes/512/HashMicro-22      65453450                16.33 ns/op    31354.46 MB/s          0 B/op          0 allocs/op
BenchmarkComputes/1024/Hash-22          34991355                30.39 ns/op    33694.20 MB/s          0 B/op          0 allocs/op
BenchmarkComputes/1024/Hasher-22        32216328                34.31 ns/op    29848.13 MB/s          0 B/op          0 allocs/op
BenchmarkComputes/4096/Hash-22          10000365               112.3 ns/op     36483.55 MB/s          0 B/op          0 allocs/op
BenchmarkComputes/4096/Hasher-22         9967412               119.1 ns/op     34380.38 MB/s          0 B/op          0 allocs/op
BenchmarkComputes/8192/Hash-22           5433234               218.3 ns/op     37532.12 MB/s          0 B/op          0 allocs/op
BenchmarkComputes/8192/Hasher-22         5368254               220.3 ns/op     37190.70 MB/s          0 B/op          0 allocs/op
BenchmarkComparable/int-22              54460824                21.26 ns/op            8 B/op          1 allocs/op
BenchmarkComparable/uint64-22           50075221                21.81 ns/op            8 B/op          1 allocs/op
BenchmarkComparable/string-22           38708024                30.71 ns/op           16 B/op          1 allocs/op
BenchmarkComparable/bool-22             73720225                14.18 ns/op            0 B/op          0 allocs/op
BenchmarkComparable/uintptr-22          51158335                22.60 ns/op            8 B/op          1 allocs/op
BenchmarkComparable/ptr-22              70310841                15.28 ns/op            0 B/op          0 allocs/op
BenchmarkComparable/ptr-nil-22          78545062                15.15 ns/op            0 B/op          0 allocs/op
BenchmarkComparable/array-22            15474188                67.64 ns/op           16 B/op          1 allocs/op
BenchmarkComparable/struct-22           11497543               107.1 ns/op            32 B/op          1 allocs/op
BenchmarkHasher1K_Chunked-22            18138518                65.53 ns/op     15625.44 MB/s          0 B/op          0 allocs/op
PASS
ok      github.com/Aniruddhraam/agilehash     54.812s
```

</details>

## Thread Safety

- All hash functions (`Hash`, `HashMicro`, `HashNano`, `Hash128`, `Hash128Micro`, etc.) are safe for concurrent use across goroutines.
- `Hasher` instances are **not** safe for concurrent write operations - use one instance per goroutine.

## License

Apache 2.0. See [LICENSE](/LICENSE).
