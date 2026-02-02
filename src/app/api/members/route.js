import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import { verifyToken } from "@/lib/auth";

// GET - List all members with optional search
export async function GET(request) {
  try {
    // Verify authentication
    const token = request.cookies.get("auth-token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let query = {};
    if (search) {
      query = {
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };
    }

    const members = await Member.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: members }, { status: 200 });
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new member
export async function POST(request) {
  try {
    // Verify authentication
    const token = request.cookies.get("auth-token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { firstName, lastName, email, phone } = await request.json();

    // Validate input
    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: "First name and last name are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Create new member - phone alanını her zaman kaydet (boş string olsa bile)
    const member = await Member.create({
      firstName,
      lastName,
      email: email?.trim() || "",
      phone: phone?.trim() || "",
    });

    return NextResponse.json({ success: true, data: member }, { status: 201 });
  } catch (error) {
    console.error("Create member error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
