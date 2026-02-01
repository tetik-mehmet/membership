import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Member from '@/models/Member';
import MemberMembership from '@/models/MemberMembership';
import { verifyToken } from '@/lib/auth';

// PUT - Update member
export async function PUT(request, { params }) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { firstName, lastName, email } = await request.json();

    await connectDB();

    const member = await Member.findByIdAndUpdate(
      id,
      { firstName, lastName, email },
      { new: true, runValidators: true }
    );

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: member },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update member error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete member
export async function DELETE(request, { params }) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
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
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Member deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete member error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
