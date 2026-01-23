import dbConnect from '@/lib/db';
import Schedule from '@/models/Schedule';
import { generateDailyTasks } from '@/lib/task-generator';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    await dbConnect();
    try {
        const body = await req.json();
        const schedule = await Schedule.findByIdAndUpdate(params.id, body, {
            new: true,
            runValidators: true,
        });

        if (!schedule) {
            return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        }

        // Automatically re-generate tasks for today if assignments changed
        if (schedule.familyId) {
            await generateDailyTasks(schedule.familyId.toString());
        }

        return NextResponse.json(schedule, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    await dbConnect();
    try {
        const schedule = await Schedule.findByIdAndDelete(params.id);

        if (!schedule) {
            return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Schedule deleted' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
    }
}
