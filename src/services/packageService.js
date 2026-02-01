import connectDB from '@/lib/db';
import MembershipPackage from '@/models/MembershipPackage';

/**
 * Get all packages
 * @param {boolean} activeOnly - Filter for active packages only
 * @returns {Promise<Array>} Array of packages
 */
export async function getAllPackages(activeOnly = false) {
  await connectDB();

  const query = activeOnly ? { isActive: true } : {};
  return MembershipPackage.find(query).sort({ durationInDays: 1 });
}

/**
 * Get package by ID
 * @param {string} packageId - Package ID
 * @returns {Promise<Object|null>} Package or null
 */
export async function getPackageById(packageId) {
  await connectDB();
  return MembershipPackage.findById(packageId);
}

/**
 * Create new package
 * @param {Object} packageData - Package data
 * @returns {Promise<Object>} Created package
 */
export async function createPackage(packageData) {
  await connectDB();

  const { name, durationInDays, price } = packageData;

  // Validate input
  if (!name || !durationInDays || price === undefined) {
    throw new Error('Name, duration, and price are required');
  }

  if (durationInDays < 1) {
    throw new Error('Duration must be at least 1 day');
  }

  if (price < 0) {
    throw new Error('Price cannot be negative');
  }

  return MembershipPackage.create({
    name,
    durationInDays,
    price,
  });
}

/**
 * Update package
 * @param {string} packageId - Package ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object|null>} Updated package or null
 */
export async function updatePackage(packageId, updateData) {
  await connectDB();

  // Validate if duration or price are being updated
  if (updateData.durationInDays !== undefined && updateData.durationInDays < 1) {
    throw new Error('Duration must be at least 1 day');
  }

  if (updateData.price !== undefined && updateData.price < 0) {
    throw new Error('Price cannot be negative');
  }

  return MembershipPackage.findByIdAndUpdate(
    packageId,
    updateData,
    { new: true, runValidators: true }
  );
}

/**
 * Deactivate package
 * @param {string} packageId - Package ID
 * @returns {Promise<Object|null>} Updated package or null
 */
export async function deactivatePackage(packageId) {
  await connectDB();
  
  return MembershipPackage.findByIdAndUpdate(
    packageId,
    { isActive: false },
    { new: true }
  );
}
