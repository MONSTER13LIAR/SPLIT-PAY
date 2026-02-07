"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e1e2f, #2a2a40)',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#00d4ff' }}>
                SPLIT<span style={{ color: '#fff' }}>PAY</span>
            </h1>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.8 }}>
                Welcome to your dashboard!
            </p>
            <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '2rem',
                borderRadius: '1rem',
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <p style={{ marginBottom: '1.5rem' }}>This is a dummy dashboard. Core features are coming soon!</p>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '0.8rem 2rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        background: '#00d4ff',
                        color: '#1e1e2f',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
