import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    // Dynamic imports to avoid module initialization errors
    const { workspace } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const postgres = (await import("postgres")).default;
    try {
        const searchParams = request.nextUrl.searchParams;
        const slug = searchParams.get("slug");

        if (!slug || slug.trim().length === 0) {
            return NextResponse.json(
                { available: false, message: "Slug is required" },
                { status: 400 },
            );
        }

        if (!process.env.POSTGRES_URL) {
            console.error("POSTGRES_URL environment variable is not set");
            return NextResponse.json(
                { available: false, message: "Database configuration error" },
                { status: 500 },
            );
        }

        let sql;
        let db;
        try {
            sql = postgres(process.env.POSTGRES_URL);
            db = drizzle(sql);
        } catch (connectionError) {
            console.error(
                "Failed to create database connection:",
                connectionError,
            );
            return NextResponse.json(
                { available: false, message: "Database connection error" },
                { status: 500 },
            );
        }

        try {
            const [existing] = await db
                .select({ id: workspace.id })
                .from(workspace)
                .where(eq(workspace.slug, slug.trim()))
                .limit(1);

            const available = !existing;

            return NextResponse.json({
                available,
                message: available
                    ? "This workspace URL is available"
                    : "This workspace URL is already taken",
            });
        } catch (dbError) {
            console.error("Database query error:", dbError);
            return NextResponse.json(
                { available: false, message: "Error checking availability" },
                { status: 500 },
            );
        } finally {
            if (sql) {
                try {
                    await sql.end({ timeout: 5 });
                } catch (endError) {
                    console.error(
                        "Error closing database connection:",
                        endError,
                    );
                }
            }
        }
    } catch (error) {
        console.error("Unexpected error checking slug availability:", error);
        // Ensure we always return JSON, even on unexpected errors
        return NextResponse.json(
            { available: false, message: "An unexpected error occurred" },
            { status: 500 },
        );
    }
}
