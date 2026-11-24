import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { z } from "zod";

const switchRoleSchema = z.object({
  targetRole: z.enum(["USER", "OWNER"], {
    message: "Invalid role. Only USER (Renter) and OWNER (Lender) are permitted.",
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = switchRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid role specified. Only Renter (USER) or Lender (OWNER) can be selected." },
        { status: 400 }
      );
    }

    const { targetRole } = parsed.data;
    const prisma = await getPrisma();

    // Fetch current role directly from the DB for safety
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If role is BROKER, do not allow arbitrary switching through this public endpoint
    if (currentUser.role === "BROKER") {
      return NextResponse.json(
        { error: "Broker accounts cannot switch roles automatically." },
        { status: 403 }
      );
    }

    if (currentUser.role === targetRole) {
      return NextResponse.json({
        success: true,
        role: targetRole,
        message: `Account is already set to ${targetRole === "OWNER" ? "Lender" : "Renter"}.`,
      });
    }

    // Check if switching from OWNER to USER: Verify no active listings exist
    if (currentUser.role === "OWNER" && targetRole === "USER") {
      const activeListingCount = await prisma.listing.count({
        where: { userId: session.user.id },
      });

      if (activeListingCount > 0) {
        return NextResponse.json(
          {
            error: `You have ${activeListingCount} active ${activeListingCount === 1 ? "listing" : "listings"}. Please delete your properties before switching to a Renter account.`,
            activeListingCount,
          },
          { status: 400 }
        );
      }
    }

    // Perform role update
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: targetRole },
    });

    return NextResponse.json({
      success: true,
      role: targetRole,
      message: `Account successfully switched to ${targetRole === "OWNER" ? "Lender" : "Renter"}.`,
    });
  } catch (error) {
    console.error("Switch role error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
