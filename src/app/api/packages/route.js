import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MembershipPackage from '@/models/MembershipPackage';
import { verifyToken } from '@/lib/auth';

// GET - List all packages
export async function GET(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const query = activeOnly ? { isActive: true } : {};
    const packages = await MembershipPackage.find(query).sort({ durationInDays: 1 });

    return NextResponse.json(
      { success: true, data: packages },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get packages error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new package
export async function POST(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, durationInDays, price } = await request.json();

    // Validate input
    if (!name || !durationInDays || price === undefined) {
      return NextResponse.json(
        { success: false, error: 'Name, duration, and price are required' },
        { status: 400 }
      );
    }

    if (durationInDays < 1) {
      return NextResponse.json(
        { success: false, error: 'Duration must be at least 1 day' },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { success: false, error: 'Price cannot be negative' },
        { status: 400 }
      );
    }

    await connectDB();

    const packageData = await MembershipPackage.create({
      name,
      durationInDays,
      price,
    });

    return NextResponse.json(
      { success: true, data: packageData },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create package error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
