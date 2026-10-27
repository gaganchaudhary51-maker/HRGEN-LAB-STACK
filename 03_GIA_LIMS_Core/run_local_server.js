'use strict';

const { startTestServer } = require('./tests/e2e/testServer');
const PORT = process.env.PORT || 3001;

async function run() {
  console.log(`Starting HRGen GIA LIMS local server on port ${PORT}...`);
  await startTestServer(PORT);
  console.log(`\n======================================================`);
  console.log(`HRGen GIA LIMS is LIVE at: http://localhost:${PORT}`);
  console.log(`======================================================`);
  console.log(`Default Demo Credentials:`);
  console.log(`  - Administrator: username: admin       | password: Admin@12345678`);
  console.log(`  - Pathologist:   username: pathologist | password: Path@12345678`);
  console.log(`  - Technician:    username: tech        | password: Tech@12345678`);
  console.log(`======================================================\n`);
}

run().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
