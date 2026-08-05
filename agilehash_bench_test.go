package agilehash_test

import (
	"fmt"
	"testing"

	"github.com/Aniruddhraam/agilehash"
)

var sizes = []int{8, 16, 32, 64, 128, 256, 512, 1024, 4096, 8192}

// Sink to prevent compiler optimizations
var sink uint64

func makeData(size int) []byte {
	data := make([]byte, size)
	for i := range data {
		data[i] = byte(i)
	}
	return data
}

func BenchmarkComputes(b *testing.B) {
	getAgilehashFunction := func(size int) (func([]byte) uint64, string) {
		switch {
		case size <= 48:
			return agilehash.HashNano, "HashNano"
		case size <= 512:
			return agilehash.HashMicro, "HashMicro"
		default:
			return agilehash.Hash, "Hash"
		}
	}

	for _, size := range sizes {
		data := makeData(size)
		b.Run(fmt.Sprintf("%d", size), func(b *testing.B) {
			b.Run("Hash", func(b *testing.B) {
				b.SetBytes(int64(size))
				for i := 0; i < b.N; i++ {
					sink = agilehash.Hash(data)
				}
			})

			b.Run("Hasher", func(b *testing.B) {
				b.SetBytes(int64(size))

				h := agilehash.New()
				for i := 0; i < b.N; i++ {
					h.Reset()
					_, _ = h.Write(data)
					sink = h.Sum64()
				}
			})

			if f, fname := getAgilehashFunction(size); fname != "Hash" {
				b.Run(fname, func(b *testing.B) {
					b.SetBytes(int64(size))

					for i := 0; i < b.N; i++ {
						sink = f(data)
					}
				})
			}
		})
	}
}
