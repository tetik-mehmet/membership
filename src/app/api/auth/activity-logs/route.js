import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AdminActivityLog from "@/models/AdminActivityLog";
import { verifyToken } from "@/lib/auth";

/**
 * GET - Admin giriş/çıkış loglarını döner.
 * Sadece NEXT_PUBLIC_ACTIVITY_LOG_VIEWER_USERNAME'de listelenen kullanıcılar erişebilir.
 * Virgülle ayrılmış birden fazla kullanıcı adı desteklenir (örn: mehmet,ahmet).
 */
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
    if (!decoded || !decoded.username) {
      return NextResponse.json(
        { success: false, error: "Geçersiz oturum" },
        { status: 401 }
      );
    }

    const allowedUsernames =
      process.env.NEXT_PUBLIC_ACTIVITY_LOG_VIEWER_USERNAME?.toLowerCase()
        ?.split(",")
        ?.map((u) => u.trim())
        ?.filter(Boolean) || [];
    const userAllowed = allowedUsernames.includes(
      decoded.username?.toLowerCase()
    );
    if (!userAllowed) {
      return NextResponse.json(
        { success: false, error: "Bu sayfayı görüntüleme yetkiniz yok" },
        { status: 403 }
      );
    }

    await connectDB();
    const logs = await AdminActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(500)
      .lean();

    return NextResponse.json({
      success: true,
      data: logs.map((log) => ({
        ...log,
        id: log._id.toString(),
        _id: undefined,
      })),
    });
  } catch (error) {
    console.error("Activity logs error:", error);
    return NextResponse.json(
      { success: false, error: "Bir hata oluştu" },
      { status: 500 }
    );
  }
}
