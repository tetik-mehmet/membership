import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import { verifyToken } from "@/lib/auth";

// PATCH - Update only payment status
export async function PATCH(request, { params }) {
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
    const { paymentStatus } = await request.json();

    // Validate paymentStatus
    if (!paymentStatus || !["paid", "unpaid"].includes(paymentStatus)) {
      return NextResponse.json(
        { success: false, error: "Invalid payment status" },
        { status: 400 }
      );
    }

    await connectDB();

    const member = await Member.findByIdAndUpdate(
      id,
      { $set: { paymentStatus } },
      { new: true, runValidators: true }
    );

    if (!member) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: member }, { status: 200 });
  } catch (error) {
    console.error("Update payment status error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
