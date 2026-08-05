OUT := out
HEADER := $(OUT)/header
RESULTS := $(OUT)/results
xxh64 := $(OUT)/xxh64
wyhash := $(OUT)/wyhash
agilehash := $(OUT)/agilehash
agilehash_comparable := $(OUT)/agilehash.HashComparable
maphash_comparable := $(OUT)/maphash.Comparable

bench:
	@mkdir -p $(OUT) 2>/dev/null || true
	@rm -f $(OUT)/*

	@go test -count=10 -bench=. -benchmem | tee $(RESULTS)
	@grep -E '^(goos|goarch|pkg|cpu):' $(RESULTS) > $(HEADER)

	@cat $(HEADER) > $(xxh64)
	@grep '^BenchmarkXXH64/' $(RESULTS) | sed 's/BenchmarkXXH64\//Benchmark/' >> $(xxh64)
	@echo "PASS" >> $(xxh64)

	@cat $(HEADER) > $(wyhash)
	@grep '^BenchmarkWyhash/' $(RESULTS) | sed 's/BenchmarkWyhash\//Benchmark/' >> $(wyhash)
	@echo "PASS" >> $(wyhash)

	@cat $(HEADER) > $(agilehash)
	@grep '^BenchmarkAgilehash/' $(RESULTS) | sed 's/BenchmarkAgilehash\//Benchmark/' >> $(agilehash)
	@echo "PASS" >> $(agilehash)

bench-comparable:
	@mkdir -p $(OUT) 2>/dev/null || true
	@rm -f $(OUT)/*

	@go test -tags=purego -count=10 -bench=BenchmarkComparable -benchmem | tee $(RESULTS)
	@grep -E '^(goos|goarch|pkg|cpu):' $(RESULTS) > $(HEADER)

	@cat $(HEADER) > $(agilehash_comparable)
	@grep '^BenchmarkComparable/agilehash/' $(RESULTS) | sed 's|agilehash/||' >> $(agilehash_comparable)
	@echo "PASS" >> $(agilehash_comparable)

	@cat $(HEADER) > $(maphash_comparable)
	@grep '^BenchmarkComparable/maphash/' $(RESULTS) | sed 's|maphash/||' >> $(maphash_comparable)
	@echo "PASS" >> $(maphash_comparable)
