import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MembershipPackage from '@/models/MembershipPackage';
import { verifyToken } from '@/lib/auth';

// PUT - Update package
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
    const { name, durationInDays, price, isActive } = await request.json();

    // Validate input
    if (durationInDays !== undefined && durationInDays < 1) {
      return NextResponse.json(
        { success: false, error: 'Duration must be at least 1 day' },
        { status: 400 }
      );
    }

    if (price !== undefined && price < 0) {
      return NextResponse.json(
        { success: false, error: 'Price cannot be negative' },
        { status: 400 }
      );
    }

    await connectDB();

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (durationInDays !== undefined) updateData.durationInDays = durationInDays;
    if (price !== undefined) updateData.price = price;
    if (isActive !== undefined) updateData.isActive = isActive;

    const packageData = await MembershipPackage.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!packageData) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: packageData },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update package error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate package (soft delete)
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

    const packageData = await MembershipPackage.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!packageData) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Package deactivated successfully', data: packageData },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete package error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
