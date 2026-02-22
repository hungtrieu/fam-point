import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Reward from '@/models/Reward';
import User from '@/models/User';
import Reminder from '@/models/Reminder';
import RedemptionRequest from '@/models/RedemptionRequest';
import PointHistory from '@/models/PointHistory';

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const body = await req.json();
        const { userId, rewardId, requestedBy } = body;

        const user = await User.findById(userId);
        const reward = await Reward.findById(rewardId);
        const requester = await User.findById(requestedBy);

        if (!user || !reward || !requester) {
            return NextResponse.json({ error: 'User, Reward or Requester not found' }, { status: 404 });
        }

        if (user.points < reward.points) {
            return NextResponse.json({ error: 'Không đủ điểm' }, { status: 400 });
        }

        if (reward.stock === 0) {
            return NextResponse.json({ error: 'Món quà này đã hết số lượng' }, { status: 400 });
        }

        // If a parent is gifting, deduct points immediately
        if (requester.role === 'parent') {
            user.points -= reward.points;
            await user.save();

            if (reward.stock > 0) {
                reward.stock -= 1;
                await reward.save();
            }

            await PointHistory.create({
                userId: user._id,
                familyId: user.familyId,
                type: 'spend',
                amount: reward.points,
                description: `Đổi quà: ${reward.title} (Bố mẹ bộ tặng)`,
                relatedId: reward._id
            });

            // Notify child that parent gifted them
            await Reminder.create({
                title: 'Bạn nhận được một món quà! 🎁',
                content: `Bố mẹ đã tặng bạn món quà: "${reward.title}". Đã trừ ${reward.points} điểm.`,
                familyId: user.familyId,
                targetUserIds: [user._id],
                createdBy: requester._id,
            });

            return NextResponse.json({
                message: 'Đổi quà thành công!',
                updatedPoints: user.points
            }, { status: 200 });
        }

        // If a child is requesting, create a redemption request
        const request = await RedemptionRequest.create({
            userId: user._id,
            rewardId: reward._id,
            familyId: user.familyId,
            points: reward.points,
            status: 'pending'
        });

        const parents = await User.find({
            familyId: user.familyId,
            role: 'parent'
        });

        if (parents.length > 0) {
            await Reminder.create({
                title: 'Yêu cầu đổi quà',
                content: `${user.name} muốn đổi quà tặng: ${reward.title} (${reward.points} điểm). Vui lòng phê duyệt hoặc điều chỉnh điểm.`,
                familyId: user.familyId,
                targetUserIds: parents.map(p => p._id),
                createdBy: user._id,
                type: 'redemption_request',
                relatedId: request._id
            });
        }

        return NextResponse.json({
            message: 'Yêu cầu đổi quà đã được gửi tới bố mẹ!',
            requestId: request._id
        }, { status: 200 });

    } catch (error) {
        console.error('Redeem error:', error);
        return NextResponse.json({ error: 'Failed to redeem reward' }, { status: 500 });
    }
}
