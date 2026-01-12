import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            familyId: user.familyId,
            points: user.points,
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    await dbConnect();
    try {
        const body = await req.json();
        const { userId, name, email, currentPassword, newPassword } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Handle password change if requested
        if (currentPassword && newPassword) {
            const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordMatch) {
                return NextResponse.json({ error: 'Mật khẩu hiện tại không chính xác' }, { status: 400 });
            }
            user.password = await bcrypt.hash(newPassword, 10);
        }

        // Update name and email if provided
        if (name) user.name = name;
        if (email) user.email = email;

        await user.save();

        const updatedUser = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            familyId: user.familyId,
            points: user.points,
        };

        return NextResponse.json(updatedUser, { status: 200 });
    } catch (error: any) {
        console.error('Profile update error:', error);
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Email đã được sử dụng trong gia đình này' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Không thể cập nhật thông tin cá nhân' }, { status: 500 });
    }
}
