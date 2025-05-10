import 'server-only';
import { NextResponse } from 'next/server';
import { getSystemSettings, updateSystemSettings } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';
import type { SystemSettings } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

// Helper to check if the current user is an admin
async function isAdmin() {
  const session = await auth();
  return session?.user?.role === 'admin';
}

// Interface for settings response
interface SettingsResponse {
  allowGuestUsers: boolean;
  allowRegistration: boolean;
  braveSearchApiKey?: string | null;
  [key: string]: any;
}

// Helper to set settings cookies in response
function setSettingsCookies(
  response: NextResponse,
  settings: SettingsResponse,
) {
  // Set cookie for guest access setting
  response.cookies.set({
    name: 'allowGuestAccess',
    value: String(settings.allowGuestUsers ?? true),
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}

// GET /admin/api/settings - Get system settings
export async function GET() {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 },
      );
    }

    // Get system settings
    const settings = await getSystemSettings();

    let responseData: SettingsResponse;
    if (!settings) {
      // If no settings exist, return default values
      responseData = {
        allowGuestUsers: true,
        allowRegistration: true,
      };
    } else {
      responseData = settings;
    }

    // Create response with settings
    const response = NextResponse.json(responseData);

    // Set cookies based on settings
    return setSettingsCookies(response, responseData);
  } catch (error) {
    console.error('Failed to get settings:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 },
    );
  }
}

// PUT /admin/api/settings - Update system settings
export async function PUT(request: Request) {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 },
      );
    }

    const { allowGuestUsers, allowRegistration, braveSearchApiKey } =
      await request.json();

    // Validate inputs
    if (
      typeof allowGuestUsers !== 'boolean' ||
      typeof allowRegistration !== 'boolean' ||
      (braveSearchApiKey !== undefined && typeof braveSearchApiKey !== 'string')
    ) {
      return NextResponse.json({ error: 'Invalid settings' }, { status: 400 });
    }

    // Update settings
    const updatedSettings = await updateSystemSettings({
      allowGuestUsers,
      allowRegistration,
      braveSearchApiKey,
    });

    // Create response with updated settings
    const response = NextResponse.json(updatedSettings[0]);

    // Set cookies based on updated settings
    return setSettingsCookies(response, updatedSettings[0] as SettingsResponse);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 },
    );
  }
}
