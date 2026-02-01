import connectDB from '@/lib/db';
import MemberMembership from '@/models/MemberMembership';
import MembershipPackage from '@/models/MembershipPackage';
import { addDays } from 'date-fns';

/**
 * Get all memberships with optional filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of memberships
 */
export async function getAllMemberships(filters = {}) {
  await connectDB();

  let query = {};
  if (filters.status) query.status = filters.status;
  if (filters.memberId) query.memberId = filters.memberId;

  return MemberMembership.find(query)
    .populate('memberId', 'firstName lastName email')
    .populate('packageId', 'name durationInDays price')
    .sort({ createdAt: -1 });
}

/**
 * Get membership by ID
 * @param {string} membershipId - Membership ID
 * @returns {Promise<Object|null>} Membership or null
 */
export async function getMembershipById(membershipId) {
  await connectDB();
  
  return MemberMembership.findById(membershipId)
    .populate('memberId', 'firstName lastName email')
    .populate('packageId', 'name durationInDays price');
}

/**
 * Get active membership for a member
 * @param {string} memberId - Member ID
 * @returns {Promise<Object|null>} Active membership or null
 */
export async function getActiveMembershipForMember(memberId) {
  await connectDB();

  return MemberMembership.findOne({
    memberId,
    status: 'active',
  })
    .populate('memberId', 'firstName lastName email')
    .populate('packageId', 'name durationInDays price');
}

/**
 * Assign package to member
 * @param {Object} data - Assignment data
 * @returns {Promise<Object>} Created membership
 */
export async function assignPackageToMember(data) {
  await connectDB();

  const { memberId, packageId, startDate } = data;

  if (!memberId || !packageId || !startDate) {
    throw new Error('Member ID, package ID, and start date are required');
  }

  // Check if member already has an active membership
  const existingMembership = await MemberMembership.findOne({
    memberId,
    status: 'active',
  });

  if (existingMembership) {
    throw new Error('Member already has an active membership');
  }

  // Get package to calculate end date
  const packageData = await MembershipPackage.findById(packageId);
  if (!packageData) {
    throw new Error('Package not found');
  }

  if (!packageData.isActive) {
    throw new Error('Package is not active');
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

  return membership;
}

/**
 * Renew membership
 * @param {Object} data - Renewal data
 * @returns {Promise<Object>} New membership
 */
export async function renewMembership(data) {
  await connectDB();

  const { membershipId, packageId, startDate } = data;

  if (!membershipId || !packageId || !startDate) {
    throw new Error('Membership ID, package ID, and start date are required');
  }

  // Find the old membership
  const oldMembership = await MemberMembership.findById(membershipId);
  if (!oldMembership) {
    throw new Error('Membership not found');
  }

  // Check if member has any other active membership
  const activeMembership = await MemberMembership.findOne({
    memberId: oldMembership.memberId,
    status: 'active',
    _id: { $ne: membershipId },
  });

  if (activeMembership) {
    throw new Error('Member already has another active membership');
  }

  // Get package to calculate end date
  const packageData = await MembershipPackage.findById(packageId);
  if (!packageData) {
    throw new Error('Package not found');
  }

  if (!packageData.isActive) {
    throw new Error('Package is not active');
  }

  // Mark old membership as expired
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

  return newMembership;
}

/**
 * Update membership status
 * @param {string} membershipId - Membership ID
 * @param {string} status - New status
 * @returns {Promise<Object|null>} Updated membership or null
 */
export async function updateMembershipStatus(membershipId, status) {
  await connectDB();

  const validStatuses = ['active', 'expired', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid status');
  }

  return MemberMembership.findByIdAndUpdate(
    membershipId,
    { status },
    { new: true }
  )
    .populate('memberId', 'firstName lastName email')
    .populate('packageId', 'name durationInDays price');
}

/**
 * Check and update expired memberships
 * Updates all active memberships where endDate is in the past
 * @returns {Promise<Object>} Update result
 */
export async function checkAndUpdateExpiredMemberships() {
  await connectDB();

  const now = new Date();

  const result = await MemberMembership.updateMany(
    {
      status: 'active',
      endDate: { $lt: now },
    },
    {
      status: 'expired',
    }
  );

  return {
    modifiedCount: result.modifiedCount,
    message: `${result.modifiedCount} memberships marked as expired`,
  };
}

/**
 * Delete membership
 * @param {string} membershipId - Membership ID
 * @returns {Promise<Object|null>} Deleted membership or null
 */
export async function deleteMembership(membershipId) {
  await connectDB();
  return MemberMembership.findByIdAndDelete(membershipId);
}

/**
 * Get membership statistics
 * @returns {Promise<Object>} Statistics
 */
export async function getMembershipStats() {
  await connectDB();

  const totalActive = await MemberMembership.countDocuments({ status: 'active' });
  const totalExpired = await MemberMembership.countDocuments({ status: 'expired' });
  const totalCancelled = await MemberMembership.countDocuments({ status: 'cancelled' });

  return {
    active: totalActive,
    expired: totalExpired,
    cancelled: totalCancelled,
    total: totalActive + totalExpired + totalCancelled,
  };
}
