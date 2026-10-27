# Backup / Restore DR Test

1. Create known dataset and audit events.
2. Generate admin backup.
3. Verify SHA-256 manifest.
4. Alter backup bytes and confirm restore is rejected.
5. Restore intact backup.
6. Confirm known records and audit history are present.
7. Confirm pre-restore snapshot exists.
8. Confirm BACKUP_RESTORED audit event exists.
9. Record RPO/RTO achieved in the target deployment environment.

Acceptance: zero silent data loss for the tested dataset and complete restore audit evidence.
