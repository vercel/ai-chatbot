import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organization, user } from '@/lib/db/schema';
import { generateHashedPassword } from '@/lib/db/utils';
import { eq } from 'drizzle-orm';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationName, adminEmail, adminPassword } = body;

    // Validate input
    if (!organizationName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, adminEmail));

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Generate organization slug
    let slug = generateSlug(organizationName);
    let slugCounter = 1;

    // Ensure slug is unique
    while (true) {
      const existingOrg = await db
        .select()
        .from(organization)
        .where(eq(organization.slug, slug));

      if (existingOrg.length === 0) {
        break;
      }

      slug = `${generateSlug(organizationName)}-${slugCounter}`;
      slugCounter++;
    }

    // Create organization
    const [newOrg] = await db
      .insert(organization)
      .values({
        name: organizationName,
        slug: slug,
        settings: {},
      })
      .returning();

    // Create admin user
    const hashedPassword = generateHashedPassword(adminPassword);
    await db.insert(user).values({
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      organizationId: newOrg.id,
    });

    return NextResponse.json({
      success: true,
      organization: {
        id: newOrg.id,
        name: newOrg.name,
        slug: newOrg.slug,
      },
    });
  } catch (error) {
    console.error('Organization registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}