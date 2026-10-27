# HRGen GIA LIMS — Antigravity Workspace

## What to do
1. Extract this ZIP into the Antigravity workspace folder you created. Extract into a new empty folder; do not overwrite another project or a folder containing important local changes.
2. Open that extracted folder as the project/workspace in Antigravity Desktop 2.0.
3. Open `ANTIGRAVITY_TASK_PROMPT_HI.md`, copy the complete prompt, and paste it into Antigravity chat/agent.
4. Let Antigravity inspect the existing Docker/Compose setup first. Docker is expected to already be installed; the prompt specifically says not to reinstall it.
5. Review its first proposed commands before approving any command that modifies files, runs migrations, or changes containers.

## Project contents
This bundle contains the latest available HRGen GIA LIMS tenant-RLS hardening source package, including UI, server, database migrations, Docker Compose, tests and validation documentation. It does not contain your private `.env` or live credentials. Do not put production credentials or patient data in test runs.

## Important
This is a source workspace bundle, not a claim of production qualification. The task prompt requires actual PostgreSQL tenant isolation and browser E2E evidence before the release status can change.
