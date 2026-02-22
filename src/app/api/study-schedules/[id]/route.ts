import dbConnect from '@/lib/db';
import StudySchedule from '@/models/StudySchedule';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await dbConnect();
    try {
        const body = await req.json();
        const schedule = await StudySchedule.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });

        if (!schedule) {
            return NextResponse.json({ error: 'Study schedule not found' }, { status: 404 });
        }

        return NextResponse.json(schedule, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update study schedule' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await dbConnect();
    try {
        const schedule = await StudySchedule.findByIdAndDelete(id);

        if (!schedule) {
            return NextResponse.json({ error: 'Study schedule not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Study schedule deleted' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete study schedule' }, { status: 500 });
    }
}
