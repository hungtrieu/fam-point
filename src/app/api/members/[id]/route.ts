import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    await dbConnect();
    try {
        const { id } = params;

        const member = await User.findById(id).select('name email points role avatar');

        if (!member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        return NextResponse.json(member, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch member:', error);
        return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 });
    }
}
