import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MemberMembership from '@/models/MemberMembership';
import MembershipPackage from '@/models/MembershipPackage';
import { verifyToken } from '@/lib/auth';
import { addDays } from 'date-fns';

// POST - Renew membership
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

    const { membershipId, packageId, startDate } = await request.json();

    // Validate input
    if (!membershipId || !packageId || !startDate) {
      return NextResponse.json(
        { success: false, error: 'Membership ID, package ID, and start date are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the old membership
    const oldMembership = await MemberMembership.findById(membershipId);
    if (!oldMembership) {
      return NextResponse.json(
        { success: false, error: 'Membership not found' },
        { status: 404 }
      );
    }

    // Check if member has any other active membership
    const activeMembership = await MemberMembership.findOne({
      memberId: oldMembership.memberId,
      status: 'active',
      _id: { $ne: membershipId },
    });

    if (activeMembership) {
      return NextResponse.json(
        { success: false, error: 'Member already has another active membership' },
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

    // Mark old membership as expired/cancelled
    oldMembership.status = 'expired';
    await oldMembership.save();

    // Calculate end date for new membership
    const start = new Date(startDate);
    const endDate = addDays(start, packageData.durationInDays);

    // Create new membership
    const newMembership = await MemberMembership.create({
      memberId: oldMembership.memberId,
      packageId,
      startDate: start,
      endDate,
      status: 'active',
    });

    // Populate references before returning
    await newMembership.populate('memberId', 'firstName lastName email');
    await newMembership.populate('packageId', 'name durationInDays price');

    return NextResponse.json(
      { success: true, data: newMembership },
      { status: 201 }
    );
  } catch (error) {
    console.error('Renew membership error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
