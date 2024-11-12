import { auth } from '@/app/(auth)/auth';
import { AssumeRoleCommand } from '@aws-sdk/client-sts';
import { STSClient } from '@aws-sdk/client-sts';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const app = searchParams.get('app');

  if (!app) {
    return new Response('Missing app', { status: 400 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { creds, error } = await getCredentails();
  if (error) {
    return new Response('Error getting credentials', { status: 500 });
  }

  const response = {
    accessKeyId: creds?.AccessKeyId,
    secretAccessKey: creds?.SecretAccessKey,
    sessionToken: creds?.SessionToken,
    region: process.env.AWS_REGION,
  };

  return Response.json(response, { status: 200 });
}

const getCredentails = async () => {
  const client = new STSClient({
    region: process.env.AWS_REGION || '',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
  try {
    const command = new AssumeRoleCommand({
      RoleArn: process.env.AWS_TRANSCRIBE_ROLE_ARN,
      RoleSessionName: 'TranscribeRoleSession',
      DurationSeconds: 900, // 15 mins
    });
    const response = await client.send(command);
    return { creds: response.Credentials, error: null };
  } catch (err) {
    console.error(err);
    return { error: err };
  }
};
