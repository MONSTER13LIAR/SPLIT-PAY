"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

interface AuthContextType {
    user: any;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: any) => void;
    logout: () => void;
    updateUser: (user: any) => void;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const res = await apiFetch('dj-rest-auth/user/');
            if (res.ok) {
                const userData = await res.json();
                setUser(userData);
            } else {
                setUser(null);
            }
        } catch (err) {
            console.error("Auth check failed:", err);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = (newUser: any) => {
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    const updateUser = (newUser: any) => {
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    const logout = async () => {
        try {
            await apiFetch('dj-rest-auth/logout/', { method: 'POST' });
        } catch (err) {
            console.error("Logout request failed:", err);
        }
        setUser(null);
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, updateUser, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
