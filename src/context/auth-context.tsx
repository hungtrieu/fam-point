'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export type User = {
    id: string;
    name: string;
    email: string;
    role: 'parent' | 'child';
    familyId: string;
    familyName: string;
    avatar?: string;
    points?: number;
};

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (userData: User, callbackUrl?: string) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Failed to parse user from local storage:', error);
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (userData: User, callbackUrl?: string) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        router.push(callbackUrl || '/dashboard');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        router.push('/auth/login');
    };

    const refreshUser = async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`/api/profile?userId=${user.id}`);
            if (res.ok) {
                const updatedData = await res.json();
                // Preserve familyName from current state if not returned by API
                const mergedUser = { ...user, ...updatedData };
                setUser(mergedUser);
                localStorage.setItem('user', JSON.stringify(mergedUser));
            }
        } catch (error) {
            console.error('Failed to refresh user data:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                login,
                logout,
                refreshUser,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
