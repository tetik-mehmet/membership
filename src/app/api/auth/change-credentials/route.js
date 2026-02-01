import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';
import {
  verifyToken,
  comparePassword,
  hashPassword,
  generateToken,
  getCookieOptions,
} from '@/lib/auth';

export async function PUT(request) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Oturum bulunamadı' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.adminId) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz oturum' },
        { status: 401 }
      );
    }

    const { currentPassword, newUsername, newPassword } = await request.json();

    if (!currentPassword) {
      return NextResponse.json(
        { success: false, error: 'Mevcut şifre gereklidir' },
        { status: 400 }
      );
    }

    const hasChanges = newUsername?.trim() || newPassword;
    if (!hasChanges) {
      return NextResponse.json(
        { success: false, error: 'Yeni kullanıcı adı veya şifre girin' },
        { status: 400 }
      );
    }

    if (newPassword && newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Yeni şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      );
    }

    await connectDB();

    const admin = await Admin.findById(decoded.adminId);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin bulunamadı' },
        { status: 404 }
      );
    }

    const isPasswordValid = await comparePassword(currentPassword, admin.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Mevcut şifre hatalı' },
        { status: 401 }
      );
    }

    const updates = {};

    if (newUsername?.trim()) {
      const normalizedUsername = newUsername.trim().toLowerCase();
      if (normalizedUsername !== admin.username) {
        const existing = await Admin.findOne({ username: normalizedUsername });
        if (existing) {
          return NextResponse.json(
            { success: false, error: 'Bu kullanıcı adı zaten kullanılıyor' },
            { status: 400 }
          );
        }
        updates.username = normalizedUsername;
      }
    }

    if (newPassword) {
      updates.passwordHash = await hashPassword(newPassword);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Değişiklik yapılmadı' },
        { status: 400 }
      );
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      decoded.adminId,
      { $set: updates },
      { new: true }
    );

    const response = NextResponse.json(
      {
        success: true,
        data: {
          username: updatedAdmin.username,
          message: 'Bilgiler güncellendi',
        },
      },
      { status: 200 }
    );

    if (updates.username) {
      const newToken = generateToken({
        adminId: updatedAdmin._id.toString(),
        username: updatedAdmin.username,
      });
      response.cookies.set('auth-token', newToken, getCookieOptions());
    }

    return response;
  } catch (error) {
    console.error('Change credentials error:', error);
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
