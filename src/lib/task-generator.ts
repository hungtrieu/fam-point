import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import Schedule from '@/models/Schedule';

export async function generateDailyTasks(familyId: string) {
    await dbConnect();

    // Get current date at midnight for comparison
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const dayOfWeek = startOfDay.getDay(); // 0-6

    // Find all active schedules for the family
    const schedules = await Schedule.find({ familyId, isActive: true });

    const createdTasks = [];

    for (const schedule of schedules) {
        // Check if there's an assignment for today
        const assignment = schedule.assignments.find((a: any) => a.dayOfWeek === dayOfWeek);

        if (assignment) {
            // Check if a task already exists for this schedule today
            const existingTask = await Task.findOne({
                scheduleId: schedule._id,
                scheduledDate: startOfDay,
            });

            if (existingTask) {
                // If the task exists and is still pending, update assignment in case it changed in schedule
                if (existingTask.status === 'pending') {
                    existingTask.assignedTo = assignment.assignedToName;
                    existingTask.assignedToId = assignment.assignedToId;
                    existingTask.points = schedule.points; // Also update points if they changed
                    existingTask.title = schedule.title;
                    existingTask.description = schedule.description;
                    await existingTask.save();
                }
            } else {
                // Create the task
                const newTask = await Task.create({
                    title: schedule.title,
                    description: schedule.description,
                    points: schedule.points,
                    familyId: schedule.familyId,
                    assignedTo: assignment.assignedToName,
                    assignedToId: assignment.assignedToId,
                    scheduleId: schedule._id,
                    scheduledDate: startOfDay,
                    status: 'pending',
                    createdBy: schedule.createdBy,
                });
                createdTasks.push(newTask);
            }
        } else {
            // If no assignment for today but a pending task exists (maybe it was removed from schedule)
            // We could optionally delete it, but let's be cautious.
            // For now, only ADD/UPDATE as requested.
        }
    }

    return createdTasks;
}
