import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Family from '@/models/Family';

export async function POST(req: Request) {
    try {
        const { familyName, name, email, password, role } = await req.json();

        if (!familyName || !name || !email || !password) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if family name is unique
        const existingFamily = await Family.findOne({ name: familyName });
        if (existingFamily) {
            return NextResponse.json(
                { message: 'Family name already taken' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create family
        const newFamily = await Family.create({
            name: familyName,
        });

        console.log('Created New Family:', newFamily);
        console.log('New Family ID:', newFamily._id);

        // Create user linked to family
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'parent',
            familyId: newFamily._id,
        });

        return NextResponse.json(
            {
                message: 'User created successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    familyId: user.familyId,
                    familyName: newFamily.name,
                    avatar: user.avatar,
                    points: user.points
                }
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Signup error full object:', JSON.stringify(error, null, 2));
        console.error('Signup error code:', error.code);
        console.error('Signup error keyPattern:', error.keyPattern);

        // Handle duplicate key error (E11000) specifically if needed
        if (error.code === 11000) {
            if (error.keyPattern?.name) {
                return NextResponse.json({ message: 'Family name already taken' }, { status: 400 });
            }

            // Handle email+familyId unique violation
            if (error.keyPattern?.email && error.keyPattern?.familyId) {
                return NextResponse.json({
                    message: 'User already exists in this family',
                    debug: `Duplicate found for email: ${error.keyValue?.email}`
                }, { status: 400 });
            }

            // Any other duplicate key error
            return NextResponse.json({
                message: 'Duplicate data entry',
                debugKey: error.keyPattern
            }, { status: 400 });
        }

        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}
