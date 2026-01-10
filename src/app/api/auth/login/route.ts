import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Family from '@/models/Family';

export async function POST(req: Request) {
    try {
        const { familyName, email, password } = await req.json();

        if (!familyName || !email || !password) {
            return NextResponse.json(
                { message: 'Missing family name, email or password' },
                { status: 400 }
            );
        }

        await dbConnect();

        // First, find the family by name
        const family = await Family.findOne({ name: familyName });
        if (!family) {
            return NextResponse.json(
                { message: 'Tên gia đình không tồn tại' },
                { status: 401 }
            );
        }

        // Then find the user with matching email and familyId
        const user = await User.findOne({ email, familyId: family._id });
        if (!user) {
            return NextResponse.json(
                { message: 'Email không tồn tại trong gia đình này' },
                { status: 401 }
            );
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json(
                { message: 'Mật khẩu không đúng' },
                { status: 401 }
            );
        }

        // In a real app, generate a JWT token here and set it as a cookie.
        // For now, we return the user info.

        return NextResponse.json(
            {
                message: 'Login successful',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    familyId: user.familyId,
                    familyName: family.name,
                    avatar: user.avatar,
                    points: user.points
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
