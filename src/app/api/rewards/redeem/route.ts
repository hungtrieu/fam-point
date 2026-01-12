import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Reward from '@/models/Reward';
import User from '@/models/User';
import PointHistory from '@/models/PointHistory';

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const body = await req.json();
        const { userId, rewardId } = body;

        const user = await User.findById(userId);
        const reward = await Reward.findById(rewardId);

        if (!user || !reward) {
            return NextResponse.json({ error: 'User or Reward not found' }, { status: 404 });
        }

        if (user.points < reward.points) {
            return NextResponse.json({ error: 'Không đủ điểm' }, { status: 400 });
        }

        if (reward.stock === 0) {
            return NextResponse.json({ error: 'Món quà này đã hết số lượng' }, { status: 400 });
        }

        // Deduct points
        user.points -= reward.points;
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
            amount: reward.points,
            description: `Đổi quà: ${reward.title}`,
            relatedId: reward._id
        });

        return NextResponse.json({
            message: 'Đổi quà thành công!',
            updatedPoints: user.points
        }, { status: 200 });

    } catch (error) {
        console.error('Redeem error:', error);
        return NextResponse.json({ error: 'Failed to redeem reward' }, { status: 500 });
    }
}
