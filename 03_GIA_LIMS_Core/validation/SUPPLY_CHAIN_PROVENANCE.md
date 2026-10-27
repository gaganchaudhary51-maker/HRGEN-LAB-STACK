# Supply-Chain Evidence

## Artifact
- Project: HRGen GIA LIMS
- Release: 6.0.0 / 77BUILD

## SBOM
- Format: CycloneDX 1.5
- File: SBOM_CYCLONEDX.json
- Scope: exact direct dependencies declared in package.json.

## Dependency lock
package-lock.json is NOT present. npm lock generation was attempted online and offline; both failed because registry metadata for @playwright/test was unavailable. No fabricated lockfile was added.

## Provenance / signing
SLSA provenance, in-toto attestation and Cosign/Sigstore signature are NOT claimed. Required signing infrastructure/keys are not available in this build environment.

## Reproducibility
Source/package manifest and deterministic verification scripts are present, but byte-for-byte reproducible-build verification is BLOCKED without a complete dependency lock and controlled dependency cache.

## Release status
Application/security verification is independently testable. Supply-chain maturity remains PARTIALLY VERIFIED until lockfile + controlled dependency resolution + provenance/signing are available.
