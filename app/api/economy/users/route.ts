/**
 * TiQology Human Economy - User Management API
 * Handles user registration, profile management, and lookups
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  createUser,
  getUserByHandle,
  getUserById,
  getUserStats,
  isHandleAvailable,
  searchUsers,
  updateUser,
} from "@/lib/humanEconomy/userManagement";

// GET /api/economy/users - Get current user or search users
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const handle = searchParams.get("handle");
    const checkHandle = searchParams.get("check_handle");

    // Check handle availability
    if (checkHandle) {
      const available = await isHandleAvailable(checkHandle);
      return NextResponse.json({ handle: checkHandle, available });
    }

    // Search by handle
    if (handle) {
      const user = await getUserByHandle(handle);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json(user);
    }

    // Search users
    if (query) {
      const users = await searchUsers(query);
      return NextResponse.json({ users });
    }

    // Get current user with stats
    const user = await getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const stats = await getUserStats(session.user.id);
    return NextResponse.json({ user, stats });
  } catch (error) {
    console.error("Error in GET /api/economy/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/economy/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      auth_user_id,
      email,
      handle,
      display_name,
      referred_by_code,
      metadata,
    } = body;

    if (!auth_user_id || !email || !handle) {
      return NextResponse.json(
        { error: "Missing required fields: auth_user_id, email, handle" },
        { status: 400 }
      );
    }

    const user = await createUser({
      auth_user_id,
      email,
      handle,
      display_name,
      referred_by_code,
      metadata,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/economy/users:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/economy/users - Update current user
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { display_name, bio, avatar_url, country, timezone, metadata } = body;

    const updatedUser = await updateUser(session.user.id, {
      display_name,
      bio,
      avatar_url,
      country,
      timezone,
      metadata,
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Error in PATCH /api/economy/users:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
