import dbConnect from '@/lib/db';
import StudySchedule from '@/models/StudySchedule';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const familyId = searchParams.get('familyId');
        const studentId = searchParams.get('studentId');

        const query: any = {};
        if (familyId) query.familyId = familyId;
        if (studentId) query.studentId = studentId;

        if (!familyId && !studentId) {
            return NextResponse.json({ error: 'Family ID or Student ID is required' }, { status: 400 });
        }

        const schedules = await StudySchedule.find(query)
            .sort({ dayOfWeek: 1, startTime: 1 });
        return NextResponse.json(schedules, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch study schedules' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const body = await req.json();
        const schedule = await StudySchedule.create(body);
        return NextResponse.json(schedule, { status: 201 });
    } catch (error) {
        console.error('Study schedule creation error:', error);
        return NextResponse.json({ error: 'Failed to create study schedule' }, { status: 500 });
    }
}
