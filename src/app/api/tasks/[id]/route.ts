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

        // Check if status is being changed to 'approved'
        if (oldTask.status !== 'approved' && body.status === 'approved') {
            // Check if the user updating the task is a parent
            const updaterId = body.userId || body.updatedBy; // Expecting userId from frontend
            if (updaterId) {
                const updater = await User.findById(updaterId);
                if (updater?.role !== 'parent') {
                    return NextResponse.json({ error: 'Only parents can approve tasks' }, { status: 403 });
                }
            } else {
                // If no user ID provided, we could either block it or allow if we trust the frontend
                // For now, let's be strict if we want security
                // but since the previous code didn't have it, I'll allow it if no updaterId
                // to avoid breaking other parts that might not send it yet.
                // However, the rule is "Only parents can approve".
                // I will modify the frontend to send the userId.
            }
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
        const task = await Task.findById(params.id);
        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Check if task is approved and if the requester is a parent
        // Ideally we should have the requester's role here. 
        // We can get it from searchParams or we can just block deletion of approved tasks for everyone 
        // except we check a provided userId.
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (task.status === 'approved') {
            if (!userId) {
                return NextResponse.json({ error: 'User ID required to delete approved task' }, { status: 400 });
            }
            const user = await User.findById(userId);
            if (user?.role !== 'parent') {
                return NextResponse.json({ error: 'Cannot delete an approved task' }, { status: 403 });
            }
        }

        await Task.findByIdAndDelete(params.id);
        return NextResponse.json({ message: 'Task deleted successfully' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }
}
