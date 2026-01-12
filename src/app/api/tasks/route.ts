import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const familyId = searchParams.get('familyId');

        if (!familyId) {
            return NextResponse.json([], { status: 200 });
        }

        const tasks = await Task.find({ familyId })
            .populate('createdBy', 'name')
            .populate('assignedToId', 'name')
            .sort({ createdAt: -1 });
        return NextResponse.json(tasks, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const body = await req.json();
        console.log('API POST Task Body:', body);
        const task = await Task.create(body);
        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
}
