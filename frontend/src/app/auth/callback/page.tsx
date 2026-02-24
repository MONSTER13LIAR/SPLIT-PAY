"use client";

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            // Send the code to our backend to exchange it for a JWT
            fetch('http://localhost:8000/api/google/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }),
            })
                .then(res => {
                    if (!res.ok) throw new Error('Authentication failed');
                    return res.json();
                })
                .then(data => {
                    console.log('Google login response:', data);
                    // dj-rest-auth with USE_JWT returns { access, refresh, user }
                    const token = data.access_token || data.access || data.key;
                    login(token, data.user);
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
