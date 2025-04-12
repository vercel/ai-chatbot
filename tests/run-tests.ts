import { type ChildProcess, execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import { config } from 'dotenv';
import waitOn from 'wait-on';

config({
  path: '.env.local',
});

const neonProjectId = process.env.NEON_PROJECT_ID;
const neonApiKey = process.env.NEON_API_KEY;

async function createBranch(): Promise<{
  branchId: string;
  branchConnectionUri: string;
}> {
  const createBranchResponse = await fetch(
    `https://console.neon.tech/api/v2/projects/${neonProjectId}/branches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${neonApiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        endpoints: [{ type: 'read_write' }],
        branch: {
          init_source: 'schema-only',
        },
      }),
    },
  );

  const { branch, connection_uris } = await createBranchResponse.json();

  if (!branch) {
    throw new Error('Unabled to create branch');
  }

  if (connection_uris.length === 0) {
    throw new Error('No connection URIs found');
  }

  const [connection] = connection_uris;

  if (!connection.connection_uri) {
    throw new Error('Connection URI is missing');
  }

  return {
    branchId: branch.id,
    branchConnectionUri: connection.connection_uri,
  };
}

async function deleteBranch(branchId: string) {
  await fetch(
    `https://console.neon.tech/api/v2/projects/${neonProjectId}/branches/${branchId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.NEON_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
  );
}

async function main(): Promise<void> {
  let createdBranchId: string | null = null;
  let serverProcess: ChildProcess | null = null;
  let testFailed = false;

  try {
    console.log(`Creating database branch...`);
    const { branchId, branchConnectionUri } = await createBranch();
    createdBranchId = branchId;

    console.log(`Branch created: ${branchId}`);

    console.log('Starting Next.js server...');
    serverProcess = spawn('pnpm', ['dev'], {
      env: {
        ...process.env,
        POSTGRES_URL: branchConnectionUri,
        PORT: '3000',
        PLAYWRIGHT: 'True',
      },
      stdio: ['ignore', 'ignore', 'pipe'],
    });

    if (serverProcess.stderr) {
      serverProcess.stderr.on('data', (data: Buffer) =>
        console.error(`Server error: ${data}`),
      );
    }

    console.log('Waiting for server to be ready...');
    await waitOn({ resources: ['http://localhost:3000'] });

    console.log('Running Playwright tests...');
    try {
      if (!fs.existsSync('playwright-report')) {
        fs.mkdirSync('playwright-report', { recursive: true });
      }

      execSync('pnpm playwright test --reporter=line,html,junit', {
        stdio: 'inherit',
        env: { ...process.env, POSTGRES_URL: branchConnectionUri },
      });

      console.log('✅ All tests passed!');
    } catch (testError) {
      testFailed = true;
      const exitCode = (testError as any).status || 1;
      console.error(`❌ Tests failed with exit code: ${exitCode}`);

      if (process.env.GITHUB_ACTIONS === 'true') {
        console.log(
          '::error::Playwright tests failed. See report for details.',
        );
      }
    }
  } catch (error) {
    console.error('Error during test setup or execution:', error);
    testFailed = true;
  } finally {
    if (serverProcess) {
      console.log('Shutting down server...');
      serverProcess.kill();
    }

    try {
      if (!createdBranchId) {
        console.log('No branch created');
      } else {
        console.log(`Cleaning up: deleting branch ${createdBranchId}`);
        await deleteBranch(createdBranchId);
        console.log('Branch deleted successfully');
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }

    if (testFailed) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
