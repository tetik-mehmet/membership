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
    const { firstName, lastName, email, phone } = requestData;

    await connectDB();

    // Phone alanını her zaman kaydet - boş string olsa bile MongoDB'de alan olsun
    const trimmedPhone = phone?.trim() || "";

    // Tüm alanları açıkça $set ile güncelle - phone alanını MUTLAKA dahil et
    const updateQuery = {
      $set: {
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        email: email?.trim() || "",
        phone: trimmedPhone, // Boş string olsa bile kaydet
      },
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

    // MongoDB'den dönen veriyi JSON'a çevirirken phone alanının dahil edildiğinden emin ol
    const memberData = member.toObject ? member.toObject() : member;

    // Phone alanının kesinlikle dahil edildiğinden emin ol
    if (!memberData.phone && trimmedPhone) {
      memberData.phone = trimmedPhone;
    }

    return NextResponse.json(
      { success: true, data: memberData },
      { status: 200 }
    );
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
