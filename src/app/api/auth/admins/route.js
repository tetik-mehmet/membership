import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Admin from "@/models/Admin";
import { verifyToken, hashPassword } from "@/lib/auth";

// GET - Admin sayısını getir
export async function GET(request) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Oturum bulunamadı" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.adminId) {
      return NextResponse.json(
        { success: false, error: "Geçersiz oturum" },
        { status: 401 }
      );
    }

    await connectDB();
    const admins = await Admin.find({ isActive: true })
      .select("username")
      .sort({ username: 1 })
      .lean();
    const count = admins.length;
    const usernames = admins.map((a) => a.username);

    return NextResponse.json(
      { success: true, data: { count, usernames } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get admin count error:", error);
    return NextResponse.json(
      { success: false, error: "Bir hata oluştu" },
      { status: 500 }
    );
  }
}

// POST - Yeni admin oluştur (sadece giriş yapmış adminler)
export async function POST(request) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Oturum bulunamadı" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.adminId) {
      return NextResponse.json(
        { success: false, error: "Geçersiz oturum" },
        { status: 401 }
      );
    }

    const { username, password } = await request.json();

    if (!username?.trim()) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı adı gerekli" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Şifre en az 6 karakter olmalıdır" },
        { status: 400 }
      );
    }

    const normalizedUsername = username.trim().toLowerCase();

    await connectDB();

    const existing = await Admin.findOne({ username: normalizedUsername });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Bu kullanıcı adı zaten kullanılıyor" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const newAdmin = await Admin.create({
      username: normalizedUsername,
      passwordHash,
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newAdmin._id.toString(),
          username: newAdmin.username,
          message: "Admin başarıyla oluşturuldu",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      { success: false, error: "Bir hata oluştu" },
      { status: 500 }
    );
  }
}
