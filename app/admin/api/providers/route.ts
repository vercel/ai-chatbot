import 'server-only';
import { NextResponse } from 'next/server';
import { getProviders, updateProvider } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';
import { getProviderConfigStatus } from '@/lib/ai/models';

// Define a type for the provider config item
interface ProviderConfigItem {
  fromEnv: boolean;
  apiKey: string | null;
  baseUrl: string | null;
}

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
    const envConfig = await getProviderConfigStatus();

    // Merge the environment variable information with the provider data
    const providersWithEnvInfo = providers.map((provider: any) => {
      const slug = provider.slug.toLowerCase();
      const envInfo = envConfig[slug] as ProviderConfigItem | undefined;

      // Make sure envInfo exists and has the fromEnv property set to true
      if (envInfo && envInfo.fromEnv) {
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

export const dynamic = 'force-dynamic';
