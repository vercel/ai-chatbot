import 'server-only';
import { NextResponse } from 'next/server';
import { getSystemSettings } from '@/lib/db/queries';

// GET /api/registration-status - Check if registration is allowed
export async function GET() {
  try {
    // Get system settings
    const settings = await getSystemSettings();

    // If no settings exist, default to allowing registration
    if (!settings) {
      return NextResponse.json({ allowed: true });
    }

    return NextResponse.json({ allowed: settings.allowRegistration });
  } catch (error) {
    console.error('Failed to check registration status:', error);
    // Default to allowing registration in case of error
    return NextResponse.json({ allowed: true });
  }
}
