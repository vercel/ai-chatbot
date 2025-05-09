import 'server-only';
import { NextResponse } from 'next/server';
import { getProviders, updateProvider } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';
import { getProviderConfigStatus } from '@/lib/ai/models';

// Helper to check if the current user is an admin
async function isAdmin() {
  const session = await auth();
  return session?.user?.role === 'admin';
}

// GET /admin/api/providers - Get all providers
export async function GET() {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 },
      );
    }

    // Get providers from database
    const providers = await getProviders();

    // Get configuration status from environment variables
    const envConfig = getProviderConfigStatus();

    // Merge the environment variable information with the provider data
    const providersWithEnvInfo = providers.map((provider) => {
      const slug = provider.slug.toLowerCase();
      const envInfo = envConfig[slug as keyof typeof envConfig];

      if (envInfo?.fromEnv) {
        return {
          ...provider,
          apiKey: envInfo.apiKey,
          baseUrl: envInfo.baseUrl || provider.baseUrl,
          fromEnv: true,
        };
      }

      return {
        ...provider,
        fromEnv: false,
      };
    });

    return NextResponse.json(providersWithEnvInfo);
  } catch (error) {
    console.error('Failed to get providers:', error);
    return NextResponse.json(
      { error: 'Failed to get providers' },
      { status: 500 },
    );
  }
}
