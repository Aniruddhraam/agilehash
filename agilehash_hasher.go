package agilehash

import (
	"hash"
	"io"
	"reflect"
	"unsafe"
)

var _ hash.Hash = (*Hasher)(nil)
var _ hash.Hash64 = (*Hasher)(nil)
var _ hash.Hash32 = (*Hasher)(nil)
var _ io.StringWriter = (*Hasher)(nil)

// Hasher implements [hash.Hash32] and [hash.Hash64] for streaming hash computation.
//
// Note: For memory-efficiency with large inputs, consider using [Hash] directly.
type Hasher struct {
	// Block accumulators (7 lanes matching the core algorithm)
	seed uint64
	see1 uint64
	see2 uint64
	see3 uint64
	see4 uint64
	see5 uint64
	see6 uint64

	// Configuration
	initSeed  uint64 // original seed for Reset
	mixedSeed uint64 // precomputed: initSeed ^ mix(initSeed^secret2, secret1)

	// Fixed-size buffers (no heap allocation after New)
	buf    [112]byte // partial block buffer (1 block = 112 bytes)
	last16 [16]byte  // last 16 bytes of total input (for finalization)
	bufN   int       // valid bytes in buf
	total  int       // total bytes written
}

// New creates a new Hasher with the default seed (0).
func New() *Hasher {
	return NewWithSeed(0)
}

// NewWithSeed creates a new Hasher with the given seed.
func NewWithSeed(seed uint64) *Hasher {
	var mixedSeed uint64
	if seed == 0 {
		mixedSeed = seed0Mixed
	} else {
		mixedSeed = seed ^ mix(seed^secret2, secret1)
	}

	h := &Hasher{
		initSeed:  seed,
		mixedSeed: mixedSeed,
	}
	h.Reset()
	return h
}

// Reset resets the hasher to its initial state.
func (h *Hasher) Reset() {
	h.seed = h.mixedSeed
	h.see1 = h.mixedSeed
	h.see2 = h.mixedSeed
	h.see3 = h.mixedSeed
	h.see4 = h.mixedSeed
	h.see5 = h.mixedSeed
	h.see6 = h.mixedSeed
	h.bufN = 0
	h.total = 0
}

// Size returns the number of bytes Sum will return (8 bytes for a 64-bit hash).
func (h *Hasher) Size() int {
	return 8
}

// BlockSize returns the hash's underlying block size.
func (h *Hasher) BlockSize() int {
	return 112
}

// Write adds more data to the running hash.
func (h *Hasher) Write(p []byte) (n int, err error) {
	if len(p) == 0 {
		return 0, nil
	}

	h.total += len(p)

	written := len(p)

	if h.bufN+len(p) <= 112 {
		h.bufN += copy(h.buf[h.bufN:], p)
		return written, nil
	}

	if h.bufN > 0 {
		n := copy(h.buf[h.bufN:], p)
		h.bufN += n
		p = p[n:]

		if h.bufN == 112 && len(p) > 0 {
			copy(h.last16[:], h.buf[96:112]) // Save last 16 bytes before overwriting buf
			ptr := unsafe.Pointer(&h.buf[0])
			h.seed = mix(u64(ptr)^secret0, u64(add(ptr, 8))^h.seed)
			h.see1 = mix(u64(add(ptr, 16))^secret1, u64(add(ptr, 24))^h.see1)
			h.see2 = mix(u64(add(ptr, 32))^secret2, u64(add(ptr, 40))^h.see2)
			h.see3 = mix(u64(add(ptr, 48))^secret3, u64(add(ptr, 56))^h.see3)
			h.see4 = mix(u64(add(ptr, 64))^secret4, u64(add(ptr, 72))^h.see4)
			h.see5 = mix(u64(add(ptr, 80))^secret5, u64(add(ptr, 88))^h.see5)
			h.see6 = mix(u64(add(ptr, 96))^secret6, u64(add(ptr, 104))^h.see6)
			h.bufN = 0
		} else if h.bufN == 112 && len(p) == 0 {
			return written, nil
		}
	}

	if len(p) > 112 {
		ptr := unsafe.Pointer(unsafe.SliceData(p))
		ptr, newI, newSeed, newSee1, newSee2, newSee3, newSee4, newSee5, newSee6 := accumBlocks(ptr, len(p), h.seed, h.see1, h.see2, h.see3, h.see4, h.see5, h.see6)
		
		processed := len(p) - newI
		copy(h.last16[:], p[processed-16:processed])

		h.seed = newSeed
		h.see1 = newSee1
		h.see2 = newSee2
		h.see3 = newSee3
		h.see4 = newSee4
		h.see5 = newSee5
		h.see6 = newSee6
		
		p = p[len(p)-newI:]
	}

	if len(p) > 0 {
		h.bufN = copy(h.buf[:], p)
	}

	return written, nil
}

// WriteString adds more data to the running hash from a string.
//
// This method allows Hasher to implement [io.StringWriter].
func (h *Hasher) WriteString(s string) (n int, err error) {
	if len(s) == 0 {
		return 0, nil
	}
	return h.Write(unsafe.Slice(unsafe.StringData(s), len(s)))
}

// Sum64 returns the current 64-bit hash value.
func (h *Hasher) Sum64() uint64 {
	if h.total == 0 {
		var a, b uint64 = secret1, h.mixedSeed
		a, b = mum(a, b)
		return mix(a^secret7, b^secret1)
	}

	p := unsafe.Pointer(&h.buf[0])

	if h.total <= 16 {
		var a, b uint64
		if h.total >= 4 {
			if h.total >= 8 {
				a = u64(p)
				b = u64(add(p, uintptr(h.total-8)))
			} else {
				a = u32(p)
				b = u32(add(p, uintptr(h.total-4)))
			}
			a ^= secret1
			b ^= h.mixedSeed ^ uint64(h.total)
			a, b = mum(a, b)
			return mix(a^secret7, b^secret1^uint64(h.total))
		}

		// 1-3 bytes
		a, b = loadUpTo3(p, h.total)
		a ^= secret1
		b ^= h.mixedSeed
		a, b = mum(a, b)
		return mix(a^secret7, b^secret1^uint64(h.total))
	}

	s := h.seed
	if h.total > 112 {
		s ^= h.see1
		s2 := h.see2 ^ h.see3
		s4 := h.see4 ^ h.see5
		s ^= h.see6
		s2 ^= s4
		s ^= s2
	}

	i := h.bufN
	if i > 16 {
		s = mix(u64(p)^secret2, u64(add(p, 8))^s)
		if i > 32 {
			s = mix(u64(add(p, 16))^secret2, u64(add(p, 24))^s)
		}
		if i > 48 {
			s = mix(u64(add(p, 32))^secret1, u64(add(p, 40))^s)
		}
		if i > 64 {
			s = mix(u64(add(p, 48))^secret1, u64(add(p, 56))^s)
		}
		if i > 80 {
			s = mix(u64(add(p, 64))^secret2, u64(add(p, 72))^s)
		}
		if i > 96 {
			s = mix(u64(add(p, 80))^secret1, u64(add(p, 88))^s)
		}
	}

	var a, b uint64
	if h.bufN >= 16 {
		a = u64(add(p, uintptr(h.bufN-16))) ^ uint64(i)
		b = u64(add(p, uintptr(h.bufN-8)))
	} else {
		var pad [16]byte
		copy(pad[:], h.last16[h.bufN:])
		copy(pad[16-h.bufN:], h.buf[:h.bufN])
		lastP := unsafe.Pointer(&pad[0])
		a = u64(lastP) ^ uint64(i)
		b = u64(add(lastP, 8))
	}

	a ^= secret1
	b ^= s
	a, b = mum(a, b)

	return mix(a^secret7, b^secret1^uint64(i))
}

// Sum32 returns the lower 32 bits of the current hash value.
func (h *Hasher) Sum32() uint32 {
	v := h.Sum64()

	return uint32(v ^ (v >> 32))
}

// Sum appends the current hash to b and returns the resulting slice.
func (h *Hasher) Sum(b []byte) []byte {
	hash := h.Sum64()

	return append(b,
		byte(hash>>56),
		byte(hash>>48),
		byte(hash>>40),
		byte(hash>>32),
		byte(hash>>24),
		byte(hash>>16),
		byte(hash>>8),
		byte(hash),
	)
}

// WriteComparable adds a comparable value to the running hash.
func (h *Hasher) WriteComparable(v any) {
	var stack [256]byte
	buf := stack[:0]
	buf = appendComparableBytes(buf, reflect.ValueOf(v))
	h.Write(buf)
}
