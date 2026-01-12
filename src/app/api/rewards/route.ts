import dbConnect from '@/lib/db';
import Reward from '@/models/Reward';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const familyId = searchParams.get('familyId');

        const filter = familyId ? { familyId } : {};
        const rewards = await Reward.find(filter).sort({ createdAt: -1 });

        return NextResponse.json(rewards, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const body = await req.json();
        const reward = await Reward.create(body);
        return NextResponse.json(reward, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 });
    }
}
