"use client";

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
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
                .then(data => {
                    console.log('Google login response:', data);
                    // Cookies are set by the backend, we just need the user object
                    login(data.user);
                    router.push('/dashboard');
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
