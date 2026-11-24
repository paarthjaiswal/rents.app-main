import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createListingSchema } from "@/lib/validations/listing";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = await getPrisma();

    // Verify role directly in the database for up-to-date permissions
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!dbUser || !["OWNER", "BROKER"].includes(dbUser.role)) {
      return NextResponse.json(
        { error: "Only lenders (owners) and brokers can create property listings. Please switch your account to Lender in your profile." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, description, rent, propertyType, address, longitude, latitude, amenities, images } = parsed.data;

    const listing = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `INSERT INTO listings ("id", "title", "description", "rent", "propertyType", "address", "amenities", "location", "images", "userId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4::"PropertyType", $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326)::geography, $9, $10, NOW(), NOW())
       RETURNING "id"`,
      title,
      description,
      rent,
      propertyType,
      address,
      amenities,
      longitude,
      latitude,
      images,
      session.user.id
    );

    return NextResponse.json({ id: listing[0].id }, { status: 201 });
  } catch (e) {
    console.error("Create listing error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
