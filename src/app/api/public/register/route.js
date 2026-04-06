import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";

// POST - Public member registration (no auth required)
export async function POST(request) {
  try {
    const { firstName, lastName, phone, email } = await request.json();

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json(
        { success: false, error: "Ad ve soyad zorunludur." },
        { status: 400 }
      );
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { success: false, error: "Telefon numarası zorunludur." },
        { status: 400 }
      );
    }

    await connectDB();

    const member = await Member.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email?.trim() || "",
      note: "",
    });

    return NextResponse.json({ success: true, data: { id: member._id } }, { status: 201 });
  } catch (error) {
    console.error("Public register error:", error);
    return NextResponse.json(
      { success: false, error: "Sunucu hatası, lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
