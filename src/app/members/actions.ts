'use server';

import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function getChildren(familyId: string) {
    await dbConnect();
    try {
        if (!familyId) {
            return { success: true, data: [] };
        }
        const children = await User.find({ familyId }).sort({ createdAt: -1 });
        return { success: true, data: JSON.parse(JSON.stringify(children)) };
    } catch (error) {
        console.error('Failed to fetch members:', error);
        return { success: false, error: 'Failed to fetch members' };
    }
}

function generatePassword(length = 8) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let retVal = '';
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

export async function createChild(familyId: string, prevState: any, formData: FormData) {
    await dbConnect();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as string || 'child';
    const avatar = formData.get('avatar') as string || '/placeholder-avatar.png'; // simple default

    if (!name || !email) {
        return { success: false, error: 'Missing required fields' };
    }

    // Generate random password
    const password = generatePassword(8);

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const newChild = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            familyId,
            avatar,
            points: 0
        });

        revalidatePath('/members');
        return {
            success: true,
            message: 'Member created successfully',
            generatedPassword: password, // Return plain password to show to user
            child: JSON.parse(JSON.stringify(newChild))
        };
    } catch (error: any) {
        console.error('Failed to create member:', error);
        if (error.code === 11000) {
            return { success: false, error: 'Email already exists' };
        }
        return { success: false, error: 'Failed to create member' };
    }
}

export async function updateChild(id: string, formData: FormData) {
    await dbConnect();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    // const avatar = formData.get('avatar') as string; // Optional update

    try {
        const updateData: any = { name, email };
        // Only update avatar if provided (handle file upload logic separately if needed, but here assuming string url or just skipped)
        // For now simple text update

        await User.findByIdAndUpdate(id, updateData, { new: true });
        revalidatePath('/members');
        return { success: true, message: 'Updated successfully' };
    } catch (error) {
        console.error('Failed to update child:', error);
        return { success: false, error: 'Failed to update child' };
    }
}

export async function deleteChild(id: string) {
    await dbConnect();
    try {
        await User.findByIdAndDelete(id);
        revalidatePath('/members');
        return { success: true, message: 'Deleted successfully' };
    } catch (error) {
        console.error('Failed to delete child:', error);
        return { success: false, error: 'Failed to delete child' };
    }
}

export async function resetChildPassword(id: string, newPassword?: string) {
    await dbConnect();
    // Use provided password or generate random one
    const passwordToUse = newPassword || generatePassword(8);

    try {
        const hashedPassword = await bcrypt.hash(passwordToUse, 10);
        await User.findByIdAndUpdate(id, { password: hashedPassword });
        revalidatePath('/members');

        return {
            success: true,
            message: 'Password reset successfully',
            generatedPassword: passwordToUse
        };
    } catch (error) {
        console.error('Failed to reset password:', error);
        return { success: false, error: 'Failed to reset password' };
    }
}
