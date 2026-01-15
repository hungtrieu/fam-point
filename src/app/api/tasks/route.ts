import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import PointHistory from '@/models/PointHistory';
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

        // If task is created as approved, add points to user
        if (task.status === 'approved' && task.assignedToId) {
            const child = await User.findById(task.assignedToId);
            if (child) {
                child.points = (child.points || 0) + task.points;
                await child.save();

                // Record history
                await PointHistory.create({
                    userId: child._id,
                    familyId: child.familyId,
                    type: 'earn',
                    amount: task.points,
                    description: `Hoàn thành công việc: ${task.title}`,
                    relatedId: task._id
                });

                // Handle recurring task: create a new one for tomorrow/next time
                if (task.repeatFrequency && task.repeatFrequency !== 'none') {
                    await Task.create({
                        title: task.title,
                        description: task.description,
                        points: task.points,
                        familyId: task.familyId,
                        createdBy: task.createdBy,
                        repeatFrequency: task.repeatFrequency,
                        status: 'pending',
                        assignedTo: 'unassigned' // Reset assignments for the next instance
                    });
                }
            }
        }

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error('Task creation error:', error);
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
}
