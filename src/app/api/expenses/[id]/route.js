import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Expense from '@/models/Expense';
import { verifyToken } from '@/lib/auth';

// GET - Get single expense
export async function GET(request, { params }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await connectDB();

    const expense = await Expense.findById(id);
    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'Harcama bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: expense },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get expense error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update expense
export async function PUT(request, { params }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { category, amount, date, description } = await request.json();

    if (amount !== undefined && amount < 0) {
      return NextResponse.json(
        { success: false, error: 'Tutar negatif olamaz' },
        { status: 400 }
      );
    }

    const validCategories = ['electricity', 'water', 'extra'];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz kategori' },
        { status: 400 }
      );
    }

    await connectDB();

    const updateData = {};
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = amount;
    if (date !== undefined) updateData.date = new Date(date);
    if (description !== undefined) updateData.description = description;

    const expense = await Expense.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'Harcama bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: expense },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete expense
export async function DELETE(request, { params }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await connectDB();

    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'Harcama bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: expense },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
