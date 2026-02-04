import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import MemberMembership from "@/models/MemberMembership";
import { verifyToken } from "@/lib/auth";

// PUT - Update member
export async function PUT(request, { params }) {
  try {
    // Verify authentication
    const token = request.cookies.get("auth-token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const requestData = await request.json();
    const { firstName, lastName, email, phone, paymentStatus, note } =
      requestData;

    await connectDB();

    // Güncellenecek alanları güvenli şekilde hazırla
    const updateFields = {};

    if (typeof firstName === "string") {
      updateFields.firstName = firstName.trim();
    }

    if (typeof lastName === "string") {
      updateFields.lastName = lastName.trim();
    }

    if (email !== undefined) {
      updateFields.email = (email || "").toString().trim();
    }

    // Phone alanını her zaman kaydetmek için: request içinde phone varsa mutlaka set et
    if (phone !== undefined) {
      const trimmedPhone = phone?.toString().trim() || "";
      updateFields.phone = trimmedPhone;
    }

    // paymentStatus varsa ekle
    if (paymentStatus !== undefined) {
      updateFields.paymentStatus = paymentStatus;
    }

    // note alanını ekle (opsiyonel)
    if (note !== undefined) {
      updateFields.note =
        typeof note === "string" ? note.trim().slice(0, 1000) : "";
    }

    const updateQuery = {
      $set: updateFields,
    };

    const member = await Member.findByIdAndUpdate(id, updateQuery, {
      new: true,
      runValidators: true,
      upsert: false,
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: member }, { status: 200 });
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete member
export async function DELETE(request, { params }) {
  try {
    // Verify authentication
    const token = request.cookies.get("auth-token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    await connectDB();

    // Önce bu üyeye ait tüm üyelikleri sil (paket otomatik iptal, listede görünmez)
    await MemberMembership.deleteMany({ memberId: id });

    const member = await Member.findByIdAndDelete(id);

    if (!member) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Member deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete member error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
