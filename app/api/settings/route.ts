import { NextResponse } from 'next/server';
import { getSystemSettings } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get system settings from database
    const settings = await getSystemSettings();

    // Create response with the settings
    const response = NextResponse.json({ success: true, settings });

    // Set cookie that reflects guest access setting
    // This will be used by middleware to enforce login requirements
    response.cookies.set({
      name: 'allowGuestAccess',
      value: String(settings?.allowGuestUsers ?? true),
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Failed to sync settings to cookies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync settings' },
      { status: 500 },
    );
  }
}
