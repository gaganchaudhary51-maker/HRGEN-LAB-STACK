# Supply-Chain Gate

| Control | Status | Evidence |
|---|---|---|
| Exact dependency versions in package.json | VERIFIED | package.json |
| CycloneDX direct-dependency SBOM | VERIFIED | SBOM_CYCLONEDX.json |
| package-lock.json | BLOCKED | registry metadata unavailable |
| npm ci reproducibility | BLOCKED | lockfile absent |
| SLSA provenance | UNVERIFIED | signing/build infrastructure unavailable |
| in-toto attestation | UNVERIFIED | attestation tooling unavailable |
| Cosign/Sigstore signature | UNVERIFIED | signing tooling/key unavailable |
| Byte-for-byte reproducible build | BLOCKED | dependency lock unavailable |
