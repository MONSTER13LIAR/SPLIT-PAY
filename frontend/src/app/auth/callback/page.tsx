"use client";

import React, { useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const loginAttempted = useRef(false);

    useEffect(() => {
        const code = searchParams.get('code');
        if (code && !loginAttempted.current) {
            loginAttempted.current = true;
            console.log('DEBUG: Auth callback code found, attempting login...');

            // Send the code to our backend to exchange it for a JWT (now in HttpOnly cookie)
            apiFetch('api/google/', {
                method: 'POST',
                body: JSON.stringify({ code }),
            })
                .then(async res => {
                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({}));
                        console.error('DEBUG: Google Login API Error Response:', errorData);
                        throw new Error(errorData.error || 'Authentication failed');
                    }
                    return res.json();
                })
                .then(async data => {
                    console.log('DEBUG: Google login SUCCESS, response data:', data);
                    // Cookies are set by the backend, we just need to update the frontend state
                    // We await login() now because it calls checkAuth() which is async
                    if (data.user) {
                        await login(data.user);
                        console.log('DEBUG: Frontend login state updated, redirecting to dashboard');
                        router.push('/dashboard');
                    } else {
                        console.error('DEBUG: No user object in login response', data);
                        throw new Error('User data missing from login response');
                    }
                })
                .catch(err => {
                    console.error('OAuth Error:', err);
                    router.push('/login?error=auth_failed');
                });
        }
    }, [searchParams, login, router]);

    return (
        <div style={{
            height: '100vh',
            background: '#000',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div className="spinner" style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(255,255,255,0.1)',
                    borderTopColor: '#ff3d00',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 1.5rem'
                }}></div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Authenticating...</h2>
                <p style={{ opacity: 0.5, marginTop: '0.5rem' }}>Finalizing your premium experience.</p>
            </div>

            <style jsx>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthCallbackContent />
        </Suspense>
    );
}
