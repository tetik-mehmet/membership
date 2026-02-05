import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import MemberMembership from "@/models/MemberMembership";
import AdminActivityLog from "@/models/AdminActivityLog";
import { verifyToken } from "@/lib/auth";

// PUT - Update membership (status, startDate, endDate, packageId)
export async function PUT(request, { params }) {
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
    const body = await request.json();
    const { status, startDate, endDate, packageId } = body;

    await connectDB();

    const updateData = {};
    if (status !== undefined) {
      if (!["active", "expired", "cancelled"].includes(status)) {
        return NextResponse.json(
          { success: false, error: "Invalid status" },
          { status: 400 }
        );
      }
      updateData.status = status;
    }
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (packageId !== undefined) updateData.packageId = packageId;

    const membership = await MemberMembership.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("memberId", "firstName lastName email")
      .populate("packageId", "name durationInDays price");

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Membership not found" },
        { status: 404 }
      );
    }

    // Üyelik güncelleme: özellikle status/ tarih / paket değişiklikleri için log (yenileme ayrı endpoint'te)
    try {
      if (decoded?.adminId && decoded?.username) {
        const memberName = membership.memberId
          ? `${membership.memberId.firstName} ${membership.memberId.lastName}`.trim()
          : undefined;

        await AdminActivityLog.create({
          adminId: decoded.adminId,
          username: decoded.username,
          targetMemberId: membership.memberId?._id,
          targetMemberName: memberName,
          targetMembershipId: membership._id,
          action: "membership_updated",
          timestamp: new Date(),
        });
      }
    } catch (logError) {
      console.error("Membership update log error:", logError);
      // Log hatası, üyelik güncellemeyi engellemesin
    }

    return NextResponse.json(
      { success: true, data: membership },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update membership error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete membership
export async function DELETE(request, { params }) {
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

    await connectDB();

    const membership = await MemberMembership.findByIdAndDelete(id);

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Membership not found" },
        { status: 404 }
      );
    }

    // Hedef üye bilgisini bul
    let member = null;
    try {
      member = await Member.findById(membership.memberId).select(
        "firstName lastName"
      );
    } catch {
      member = null;
    }

    // Üyelik silme işlemini admin aktivite loglarına kaydet
    try {
      if (decoded?.adminId && decoded?.username) {
        await AdminActivityLog.create({
          adminId: decoded.adminId,
          username: decoded.username,
          targetMemberId: member?._id || membership.memberId,
          targetMemberName: member
            ? `${member.firstName} ${member.lastName}`.trim()
            : undefined,
          targetMembershipId: membership._id,
          action: "membership_deleted",
          timestamp: new Date(),
        });
      }
    } catch (logError) {
      console.error("Membership delete log error:", logError);
      // Log hatası, üyelik silmeyi engellemesin
    }

    return NextResponse.json(
      { success: true, message: "Membership deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete membership error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
