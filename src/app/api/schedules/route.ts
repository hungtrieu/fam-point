import dbConnect from '@/lib/db';
import Schedule from '@/models/Schedule';
import { generateDailyTasks } from '@/lib/task-generator';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const familyId = searchParams.get('familyId');

        if (!familyId) {
            return NextResponse.json({ error: 'Family ID is required' }, { status: 400 });
        }

        const schedules = await Schedule.find({ familyId })
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
        return NextResponse.json(schedules, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const body = await req.json();
        const schedule = await Schedule.create(body);

        // Automatically generate tasks for today if this schedule has an assignment for today
        if (schedule.familyId) {
            await generateDailyTasks(schedule.familyId.toString());
        }

        return NextResponse.json(schedule, { status: 201 });
    } catch (error) {
        console.error('Schedule creation error:', error);
        return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
    }
}
