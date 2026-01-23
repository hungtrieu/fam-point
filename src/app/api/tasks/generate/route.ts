import { generateDailyTasks } from '@/lib/task-generator';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { familyId } = await req.json();

        if (!familyId) {
            return NextResponse.json({ error: 'Family ID is required' }, { status: 400 });
        }

        const createdTasks = await generateDailyTasks(familyId);

        return NextResponse.json({
            message: `Generated ${createdTasks.length} tasks`,
            tasks: createdTasks
        }, { status: 200 });
    } catch (error) {
        console.error('Task generation error:', error);
        return NextResponse.json({ error: 'Failed to generate tasks' }, { status: 500 });
    }
}
