import connectDB from '@/lib/db';
import Member from '@/models/Member';

/**
 * Get all members
 * @param {string} search - Optional search query
 * @returns {Promise<Array>} Array of members
 */
export async function getAllMembers(search = '') {
  await connectDB();

  let query = {};
  if (search) {
    query = {
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    };
  }

  return Member.find(query).sort({ createdAt: -1 });
}

/**
 * Get member by ID
 * @param {string} memberId - Member ID
 * @returns {Promise<Object|null>} Member or null
 */
export async function getMemberById(memberId) {
  await connectDB();
  return Member.findById(memberId);
}

/**
 * Create new member
 * @param {Object} memberData - Member data
 * @returns {Promise<Object>} Created member
 */
export async function createMember(memberData) {
  await connectDB();

  const { firstName, lastName, email } = memberData;

  if (!firstName || !lastName) {
    throw new Error('First name and last name are required');
  }

  return Member.create({
    firstName,
    lastName,
    email: email || undefined,
  });
}

/**
 * Update member
 * @param {string} memberId - Member ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object|null>} Updated member or null
 */
export async function updateMember(memberId, updateData) {
  await connectDB();

  return Member.findByIdAndUpdate(
    memberId,
    updateData,
    { new: true, runValidators: true }
  );
}

/**
 * Delete member
 * @param {string} memberId - Member ID
 * @returns {Promise<Object|null>} Deleted member or null
 */
export async function deleteMember(memberId) {
  await connectDB();
  return Member.findByIdAndDelete(memberId);
}
