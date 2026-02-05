import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import AdminActivityLog from "@/models/AdminActivityLog";
import { verifyToken } from "@/lib/auth";

// PATCH - Update only member note
export async function PATCH(request, { params }) {
  try {
    // Verify authentication
    const token = request.cookies.get("auth-token")?.value;
    const decoded = token ? verifyToken(token) : null;

    if (!token || !decoded) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { note } = await request.json();

    // Not metnini güvenli şekilde hazırla
    const safeNote = typeof note === "string" ? note.trim().slice(0, 1000) : "";

    await connectDB();

    const member = await Member.findByIdAndUpdate(
      id,
      { $set: { note: safeNote } },
      { new: true, runValidators: false, strict: false }
    );

    if (!member) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    // Üye notu güncelleme işlemini admin aktivite loglarına kaydet
    try {
      if (decoded?.adminId && decoded?.username) {
        await AdminActivityLog.create({
          adminId: decoded.adminId,
          username: decoded.username,
          targetMemberId: member._id,
          targetMemberName: `${member.firstName} ${member.lastName}`.trim(),
          targetNote: safeNote,
          action: "member_note_updated",
          timestamp: new Date(),
        });
      }
    } catch (logError) {
      console.error("Member note update log error:", logError);
      // Log hatası, not güncellemeyi engellemesin
    }

    return NextResponse.json(
      { success: true, data: { note: safeNote } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update member note error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
