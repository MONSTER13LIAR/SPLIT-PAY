"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';

interface AuthContextType {
    user: any;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: any) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (user: any) => void;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        try {
            const res = await apiFetch('dj-rest-auth/user/');
            if (res.ok) {
                const userData = await res.json();
                console.log("DEBUG: checkAuth SUCCESS:", userData);
                setUser(userData);
            } else {
                console.log("DEBUG: checkAuth FAILED (not ok):", res.status);
                setUser(null);
            }
        } catch (err) {
            console.error("Auth check failed with exception:", err);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = useCallback(async (userData: any) => {
        // If userData contains both user and tokens (dj-rest-auth style)
        const user = userData.user || userData;
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));

        // If the backend returned tokens in the body, set them as cookies
        if (userData.access || userData.access_token) {
            const token = userData.access || userData.access_token;
            document.cookie = `access-token=${token}; path=/; max-age=86400; SameSite=Lax`;
        }

        // After login, we should try to refresh our session state from the server
        await checkAuth();
    }, [checkAuth]);

    const updateUser = useCallback((newUser: any) => {
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiFetch('dj-rest-auth/logout/', { method: 'POST' });
        } catch (err) {
            console.error("Logout request failed:", err);
        }
        setUser(null);
        localStorage.removeItem('user');
        document.cookie = "access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.location.href = '/login';
    }, []);

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
