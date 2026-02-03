import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import { verifyToken } from "@/lib/auth";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request, { params }) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: memberId } = await params;
    const formData = await request.formData();
    const file = formData.get("photo");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "Fotoğraf dosyası gerekli" },
        { status: 400 }
      );
    }

    const type = file.type?.toLowerCase();
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Sadece JPEG, PNG veya WebP yükleyebilirsiniz",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "Dosya boyutu 5 MB'dan küçük olmalı" },
        { status: 400 }
      );
    }

    const tokenBlob = process.env.BLOB_READ_WRITE_TOKEN;
    if (!tokenBlob) {
      return NextResponse.json(
        { success: false, error: "Blob storage yapılandırılmamış" },
        { status: 500 }
      );
    }

    await connectDB();
    const member = await Member.findById(memberId);
    if (!member) {
      return NextResponse.json(
        { success: false, error: "Üye bulunamadı" },
        { status: 404 }
      );
    }

    const ext =
      type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : "webp";
    const filename = `members/${memberId}/${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: "public",
      token: tokenBlob,
    });

    const oldUrl = member.photoUrl;
    member.photoUrl = blob.url;
    await member.save();

    if (oldUrl && oldUrl.startsWith("https://")) {
      try {
        await del(oldUrl, { token: tokenBlob });
      } catch (_) {
        // Eski blob silinemediyse devam et
      }
    }

    return NextResponse.json({
      success: true,
      photoUrl: blob.url,
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json(
      { success: false, error: "Yükleme sırasında hata oluştu" },
      { status: 500 }
    );
  }
}
