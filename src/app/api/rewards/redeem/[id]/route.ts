import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Reward from '@/models/Reward';
import User from '@/models/User';
import Reminder from '@/models/Reminder';
import RedemptionRequest from '@/models/RedemptionRequest';
import PointHistory from '@/models/PointHistory';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        const request = await RedemptionRequest.findById(id)
            .populate('userId', 'name')
            .populate('rewardId', 'title');

        if (!request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        return NextResponse.json(request, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        const body = await req.json();
        const { status, points } = body; // status: 'approved' | 'rejected', points: optionally modified points

        const request = await RedemptionRequest.findById(id);
        if (!request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (request.status !== 'pending') {
            return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
        }

        if (status === 'rejected') {
            const { reason } = body;
            request.status = 'rejected';
            await request.save();

            const reward = await Reward.findById(request.rewardId);

            // Notify child with reason
            await Reminder.create({
                title: 'Yêu cầu đổi quà đã bị từ chối',
                content: `Yêu cầu đổi quà "${reward?.title}" của bạn đã bị từ chối.${reason ? ` Lý do: ${reason}` : ''}`,
                familyId: request.familyId,
                targetUserIds: [request.userId],
                createdBy: body.parentUserId, // Provided by client
            });

            return NextResponse.json({ message: 'Request rejected' });
        }

        if (status === 'approved') {
            const finalPoints = points !== undefined ? points : request.points;
            const user = await User.findById(request.userId);
            const reward = await Reward.findById(request.rewardId);

            if (!user || !reward) {
                return NextResponse.json({ error: 'User or Reward not found' }, { status: 404 });
            }

            if (user.points < finalPoints) {
                return NextResponse.json({ error: 'Con không đủ điểm để đổi món quà này' }, { status: 400 });
            }

            // Deduct points
            user.points -= finalPoints;
            await user.save();

            // Deduct stock if not unlimited
            if (reward.stock > 0) {
                reward.stock -= 1;
                await reward.save();
            }

            // Record history
            await PointHistory.create({
                userId: user._id,
                familyId: user.familyId,
                type: 'spend',
                amount: finalPoints,
                description: `Đổi quà: ${reward.title} (Bố mẹ đã duyệt)`,
                relatedId: reward._id
            });

            request.status = 'approved';
            request.points = finalPoints;
            await request.save();

            // Notify child
            await Reminder.create({
                title: 'Yêu cầu đổi quà đã được duyệt!',
                content: `Yêu cầu đổi quà "${reward.title}" của bạn đã được duyệt. Bạn đã dùng ${finalPoints} điểm.`,
                familyId: request.familyId,
                targetUserIds: [user._id],
                createdBy: body.parentUserId,
            });

            return NextResponse.json({
                message: 'Request approved and points deducted',
                updatedPoints: user.points
            });
        }

        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    } catch (error) {
        console.error('Request approval error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
