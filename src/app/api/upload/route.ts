import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;

    const allFiles: File[] = [...files];
    if (singleFile && !allFiles.includes(singleFile)) {
      allFiles.push(singleFile);
    }

    if (allFiles.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
    const savedUrls: string[] = [];

    for (const file of allFiles) {
      if (!allowedMimeTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} is not supported. Please upload JPEG, PNG, WEBP, or AVIF.` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || `.${file.type.split("/")[1] || "jpg"}`;
      const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext.toLowerCase()}`;
      const filePath = path.join(uploadDir, uniqueName);

      await writeFile(filePath, buffer);
      savedUrls.push(`/uploads/${uniqueName}`);
    }

    return NextResponse.json({ urls: savedUrls }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file(s)" }, { status: 500 });
  }
}
