import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AdminActivityLog from "@/models/AdminActivityLog";
import { verifyToken } from "@/lib/auth";

export async function POST(request) {
  try {
    // Çıkış logunu kaydetmek için cookie silmeden önce token'dan bilgi al
    const token = request.cookies.get("auth-token")?.value;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded?.adminId && decoded?.username) {
        await connectDB();
        await AdminActivityLog.create({
          adminId: decoded.adminId,
          username: decoded.username,
          action: "logout",
          timestamp: new Date(),
        });
      }
    }

    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    // Clear the auth cookie
    response.cookies.delete("auth-token");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
