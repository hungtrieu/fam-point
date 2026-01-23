import dbConnect from '@/lib/db';
import Reminder from '@/models/Reminder';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    try {
        const { id } = await params;
        const reminder = await Reminder.findByIdAndDelete(id);
        if (!reminder) {
            return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Reminder deleted successfully' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    try {
        const { id } = await params;
        const body = await req.json();
        const reminder = await Reminder.findByIdAndUpdate(id, body, { new: true });
        if (!reminder) {
            return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
        }
        return NextResponse.json(reminder, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
    }
}
