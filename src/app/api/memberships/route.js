import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MemberMembership from '@/models/MemberMembership';
import MembershipPackage from '@/models/MembershipPackage';
import { verifyToken } from '@/lib/auth';
import { addDays } from 'date-fns';

// GET - List memberships with filters
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
    const status = searchParams.get('status');
    const memberId = searchParams.get('memberId');

    let query = {};
    if (status) query.status = status;
    if (memberId) query.memberId = memberId;

    const memberships = await MemberMembership.find(query)
      .populate('memberId', 'firstName lastName email')
      .populate('packageId', 'name durationInDays price')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { success: true, data: memberships },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get memberships error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Assign package to member
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

    const { memberId, packageId, startDate } = await request.json();

    // Validate input
    if (!memberId || !packageId || !startDate) {
      return NextResponse.json(
        { success: false, error: 'Member ID, package ID, and start date are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if member already has an active membership
    const existingMembership = await MemberMembership.findOne({
      memberId,
      status: 'active',
    });

    if (existingMembership) {
      return NextResponse.json(
        { success: false, error: 'Member already has an active membership' },
        { status: 400 }
      );
    }

    // Get package to calculate end date
    const packageData = await MembershipPackage.findById(packageId);
    if (!packageData) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }

    if (!packageData.isActive) {
      return NextResponse.json(
        { success: false, error: 'Package is not active' },
        { status: 400 }
      );
    }

    // Calculate end date
    const start = new Date(startDate);
    const endDate = addDays(start, packageData.durationInDays);

    // Create membership
    const membership = await MemberMembership.create({
      memberId,
      packageId,
      startDate: start,
      endDate,
      status: 'active',
    });

    // Populate references before returning
    await membership.populate('memberId', 'firstName lastName email');
    await membership.populate('packageId', 'name durationInDays price');

    return NextResponse.json(
      { success: true, data: membership },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create membership error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
