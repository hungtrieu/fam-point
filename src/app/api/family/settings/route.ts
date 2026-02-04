import dbConnect from '@/lib/db';
import Family from '@/models/Family';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const family = await Family.findById(user.familyId);
        if (!family) {
            return NextResponse.json({ error: 'Family not found' }, { status: 404 });
        }

        // Initialize settings if they don't exist (e.g. for old records)
        if (!family.settings) {
            family.settings = { autoApproveTasks: true };
            await family.save();
        }

        return NextResponse.json(family.settings, { status: 200 });
    } catch (error) {
        console.error('Error fetching family settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    await dbConnect();
    try {
        const body = await req.json();
        const { userId, autoApproveTasks } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.role !== 'parent') {
            return NextResponse.json({ error: 'Only parents can update settings' }, { status: 403 });
        }

        const family = await Family.findById(user.familyId);
        if (!family) {
            return NextResponse.json({ error: 'Family not found' }, { status: 404 });
        }

        // Update settings
        if (!family.settings) {
            family.settings = {};
        }
        family.settings.autoApproveTasks = autoApproveTasks;

        await family.save();

        return NextResponse.json(family.settings, { status: 200 });
    } catch (error) {
        console.error('Error updating family settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
