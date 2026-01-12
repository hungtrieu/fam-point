import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PointHistory from '@/models/PointHistory';

export async function GET(req: NextRequest) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const history = await PointHistory.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);

        return NextResponse.json(history, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
