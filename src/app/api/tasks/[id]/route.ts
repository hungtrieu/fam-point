import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import PointHistory from '@/models/PointHistory';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    await dbConnect();
    try {
        const body = await req.json();
        console.log('API PUT Task Body:', body);

        // Find existing task to check status change
        const oldTask = await Task.findById(params.id);
        if (!oldTask) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        const task = await Task.findByIdAndUpdate(params.id, body, {
            new: true,
            runValidators: true,
        });

        // If status changed to approved, add points to user
        if (oldTask.status !== 'approved' && body.status === 'approved' && task.assignedToId) {
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

        return NextResponse.json(task, { status: 200 });
    } catch (error) {
        console.error('Task update error:', error);
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    await dbConnect();
    try {
        const task = await Task.findByIdAndDelete(params.id);
        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Task deleted successfully' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }
}
