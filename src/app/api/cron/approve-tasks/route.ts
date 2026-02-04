import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import PointHistory from '@/models/PointHistory';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    await dbConnect();

    // Simple authorization check
    const authHeader = req.headers.get('authorization');
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    // Check against an environment variable CRON_SECRET
    // If CRON_SECRET is not set, we might default to insecure or require it. 
    // To be safe for now, if env var is missing, we can maybe skip check or demand one.
    // Let's implement a check if CRON_SECRET is present.
    if (process.env.CRON_SECRET) {
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && key !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        console.log('Running auto-approve-tasks cron job...');

        // 1. Get all families that have auto-approval ENABLED (or not set, defaulting to true)
        // We look for families where settings.autoApproveTasks is NOT false
        const Family = (await import('@/models/Family')).default;
        const autoApproveFamilies = await Family.find({
            'settings.autoApproveTasks': { $ne: false }
        }).select('_id');

        const familyIds = autoApproveFamilies.map((f: any) => f._id);

        console.log(`Found ${familyIds.length} families with auto-approval enabled.`);

        if (familyIds.length === 0) {
            return NextResponse.json({
                message: 'No families with auto-approval enabled',
                processed: 0
            }, { status: 200 });
        }

        // 2. Find all completed tasks belonging to these families
        const completedTasks = await Task.find({
            status: 'completed',
            familyId: { $in: familyIds }
        });

        console.log(`Found ${completedTasks.length} tasks to approve.`);

        let approvedCount = 0;
        const results = [];

        for (const task of completedTasks) {
            try {
                // Update task status to approved
                task.status = 'approved';
                await task.save();

                // Add points to user if assigned
                if (task.assignedToId) {
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
                            description: `Hoàn thành công việc (Tự động duyệt): ${task.title}`,
                            relatedId: task._id
                        });

                        // Handle recurring task
                        if (task.repeatFrequency && task.repeatFrequency !== 'none') {
                            await Task.create({
                                title: task.title,
                                description: task.description,
                                points: task.points,
                                familyId: task.familyId,
                                createdBy: task.createdBy,
                                repeatFrequency: task.repeatFrequency,
                                status: 'pending',
                                assignedTo: 'unassigned' // Reset assignments
                            });
                        }
                    }
                }

                approvedCount++;
                results.push({ id: task._id, title: task.title, status: 'approved' });
            } catch (err) {
                console.error(`Failed to approve task ${task._id}:`, err);
                results.push({ id: task._id, error: 'Failed to process' });
            }
        }

        return NextResponse.json({
            message: 'Auto-approve job completed',
            processed: approvedCount,
            details: results
        }, { status: 200 });

    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
