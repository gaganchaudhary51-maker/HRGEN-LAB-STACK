import { router, json } from '@appdeploy/sdk';

export const handler = router({
  'GET /api/ops/health': [
    async () => json({
      ok: true,
      service: 'dsd-operations-hub',
      integrations: {
        bookingDatabase: 'not-connected',
        phleboGps: 'not-connected',
        aiAgents: 'not-connected',
        searchConsole: 'not-connected',
        deploymentProvider: 'not-connected'
      },
      note: 'The operations workspace is available; external integrations require configuration.'
    })
  ]
});
