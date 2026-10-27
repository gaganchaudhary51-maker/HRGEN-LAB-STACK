# Performance Qualification (PQ)

PQ shall use representative laboratory scenarios in the intended operating environment. Minimum scenarios:

1. Normal chemistry result from analyzer import through release.
2. QC 1-3s failure blocks approval/release.
3. Expired reagent blocks QC approval.
4. Missing/failed calibration blocks QC approval.
5. Critical result requires communication/read-back.
6. Delta REVIEW requires acknowledgement.
7. Corrected released report produces a new version without modifying the original.
8. QR verifies released report and fails after tamper simulation.
9. Backup/restore recovers a known test dataset and produces audit evidence.
10. User disablement prevents further authorized operation under that user lifecycle state.

Acceptance: representative scenarios reproduce expected results with documented evidence and no unexplained deviation.
