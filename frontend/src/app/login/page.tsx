"use client";

import React from 'react';
import './login.css';
import Spline from '@splinetool/react-spline/next';

export default function LoginPage() {
    const handleGoogleLogin = () => {
        // Redirect to Backend Google Login URL
        // Make sure the backend is running on port 8000
        window.location.href = 'http://localhost:8000/accounts/google/login/';
    };

    return (
        <div className="login-container">
            {/* 3D Flowing Grids */}
            <div className="grid-overlay">
                <div className="grid-side grid-left"></div>
                <div className="grid-side grid-right"></div>
                <div className="grid-side grid-top"></div>
                <div className="grid-side grid-bottom"></div>
            </div>

            {/* Section 1: Typing Animation */}
            <section className="intro-section">
                <div className="spline-background">
                    <Spline
                        scene="https://prod.spline.design/ZeEI4mr8s-NcZj3X/scene.splinecode"
                    />
                </div>
                <h1 className="typing-text">SPLIT PAY</h1>
                <div className="scroll-indicator">
                    <span>↓</span> Scroll to Sign In
                </div>
            </section>

            {/* Section 2: Login Card */}
            <section className="auth-section">
                <div className="login-card">
                    <div className="login-header">
                        <img src="/icon.png" alt="SplitPay Logo" className="app-logo" />
                        <h2 className="auth-title">Welcome</h2>
                        <p className="subtitle">Manage expenses, minus the stress.</p>
                    </div>

                    <div className="login-actions">
                        <button
                            onClick={handleGoogleLogin}
                            className="google-signin-button"
                        >
                            <img
                                src="https://www.svgrepo.com/show/475656/google-color.svg"
                                alt="Google Logo"
                                className="google-icon"
                            />
                            Sign in with Google
                        </button>

                        <p className="security-note">
                            <small>Secure access via Google OAuth</small>
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
