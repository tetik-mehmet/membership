import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Expense from '@/models/Expense';
import { verifyToken } from '@/lib/auth';

// GET - List all expenses (with optional filters)
export async function GET(request) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let query = {};

    if (category) query.category = category;

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const expenses = await Expense.find(query).sort({ date: -1 });

    return NextResponse.json(
      { success: true, data: expenses },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new expense
export async function POST(request) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { category, amount, date, description } = await request.json();

    if (!category || amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Kategori ve tutar gereklidir' },
        { status: 400 }
      );
    }

    const validCategories = ['electricity', 'water', 'extra'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz kategori' },
        { status: 400 }
      );
    }

    if (amount < 0) {
      return NextResponse.json(
        { success: false, error: 'Tutar negatif olamaz' },
        { status: 400 }
      );
    }

    await connectDB();

    const expense = await Expense.create({
      category,
      amount,
      date: date ? new Date(date) : new Date(),
      description: description || '',
    });

    return NextResponse.json(
      { success: true, data: expense },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
