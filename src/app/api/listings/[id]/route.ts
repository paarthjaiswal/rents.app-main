import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = await getPrisma();

    const listings = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT l."id", l."title", l."description", l."rent", l."propertyType", l."address", l."amenities", l."images",
              ST_X(l."location"::geometry) as longitude,
              ST_Y(l."location"::geometry) as latitude,
              l."createdAt", l."updatedAt",
              u."id" as "userId", u."name" as "ownerName", u."role" as "ownerType", u."phone" as "ownerPhone"
       FROM listings l
       JOIN users u ON l."userId" = u."id"
       WHERE l."id" = $1`,
      id
    );

    if (!listings.length) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json(listings[0]);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const prisma = await getPrisma();

    // Verify ownership
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to delete this listing" },
        { status: 403 }
      );
    }

    await prisma.listing.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Listing deleted successfully" });
  } catch (e) {
    console.error("Delete listing error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
