import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// GET - Mevcut kullanıcı bilgilerini getir
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

    return NextResponse.json(
      {
        success: true,
        data: {
          username: decoded.username,
          adminId: decoded.adminId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { success: false, error: "Bir hata oluştu" },
      { status: 500 }
    );
  }
}
