import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = await getPrisma();
    const listings = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT l."id", l."title", l."description", l."rent", l."propertyType", l."address", l."amenities", l."images",
              ST_X(l."location"::geometry) as longitude,
              ST_Y(l."location"::geometry) as latitude,
              l."createdAt", l."updatedAt"
       FROM listings l
       WHERE l."userId" = $1
       ORDER BY l."createdAt" DESC`,
      session.user.id
    );

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("My listings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
