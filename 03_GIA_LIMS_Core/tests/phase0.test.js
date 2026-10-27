import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const server = fs.readFileSync(path.join(root,'server.js'),'utf8');
const env = fs.readFileSync(path.join(root,'.env.example'),'utf8');

describe('Phase 0 security baseline', () => {
  it('uses PostgreSQL adapter and has no db.json persistence', () => {
    expect(server).toContain("require('./db/postgres')");
    expect(server).not.toContain('DB_FILE');
    expect(server).not.toContain('fs.writeFileSync(tmp');
  });
  it('does not contain role hardcoded passwords', () => {
    expect(server).not.toContain('ROLE_PASSWORDS');
    expect(server).not.toContain('admin123');
  });
  it('uses bcrypt user authentication', () => {
    expect(server).toContain('bcrypt.compare');
    expect(server).toContain('passwordHash');
  });
  it('requires pathologist-only electronic signoff', () => {
    expect(server).toContain("requireRole('pathologist'), requireOrderState('VALIDATED')");
  });
  it('requires explicit production bootstrap credentials', () => {
    expect(env).toContain('BOOTSTRAP_ADMIN_PASSWORD=');
    expect(env).toContain('DATABASE_URL=');
  });
});
