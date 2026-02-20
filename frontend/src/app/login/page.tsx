"use client";

import React from 'react';
import './login.css';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { getGoogleAuthUrl } from '@/utils/auth';

const Spline = dynamic(() => import('@splinetool/react-spline'), {
    ssr: false,
    loading: () => <div style={{ width: '100%', height: '100%', background: '#f0f0f0' }} />,
});

export default function LoginPage() {
    const handleGoogleLogin = () => {
        window.location.href = getGoogleAuthUrl();
    };

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-active');
                }
            });
        }, { threshold: 0.1 });

        const revealElements = document.querySelectorAll('.reveal');
        revealElements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return (
        <div className="login-container">
            {/* Floating Premium Navbar */}
            <nav className="premium-navbar">
                <div className="nav-content">
                    <div className="nav-left">
                        <img src="/icon.png" alt="SplitPay Logo" className="nav-logo" />
                        <span className="nav-brand">SplitPay</span>
                    </div>
                    <div className="nav-center">
                        <a href="#" className="nav-link">Home</a>
                        <a href="#about" className="nav-link">About</a>
                        <a href="/pricing" className="nav-link">Pricing</a>
                    </div>
                    <div className="nav-right">
                        <button className="nav-cta" onClick={handleGoogleLogin}>Get Started</button>
                    </div>
                </div>
            </nav>

            {/* 3D Flowing Grids */}
            <div className="grid-overlay">
                <div className="grid-side grid-left"></div>
                <div className="grid-side grid-right"></div>
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

            {/* Section 2: Login Card & Secondary Spline */}
            <section className="auth-section">
                <div className="auth-content-wrapper">
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

                    <div className="right-spline-container">
                        <Spline scene="https://prod.spline.design/FETOIZbodVzjgGPF/scene.splinecode" />
                    </div>
                </div>
            </section>

            {/* Section 3: About SplitPay */}
            <section id="about" className="about-section">
                <div className="about-content">
                    <header className="about-header reveal">
                        <h2 className="section-title">About SplitPay</h2>
                        <p className="about-tagline">Making the tech world a little more fair, one bill at a time.</p>
                    </header>

                    <div className="about-grid">
                        <div className="about-main reveal">
                            <h3>What is SplitPay?</h3>
                            <p>SplitPay is a smart bill-splitting app designed specifically for Indian friend groups who value fairness and simplicity. We solve the age-old problem of "that one friend who never pays" with an intelligent turn-based payment system.</p>

                            <h3>The Problem We Solve</h3>
                            <p>Ever been in a friend group where payments feel awkward, veg friends subsidize non-veg meals, or debts just never get settled? We built SplitPay to fix exactly that.</p>

                            <div className="features-highlight">
                                <div className="feature-item">
                                    <h4>Turn-Based Payment</h4>
                                    <p>No more dodging! The app assigns whose turn it is to pay. Fair, transparent, automatic.</p>
                                </div>
                                <div className="feature-item">
                                    <h4>Smart Category Splitting</h4>
                                    <p>Set dietary preferences once (Veg/Non-veg/Alcohol) and the app does the math automatically.</p>
                                </div>
                                <div className="feature-item">
                                    <h4>Democratic Voting</h4>
                                    <p>Settle debts, extend deadlines, or manage members through group voting.</p>
                                </div>
                            </div>
                        </div>

                        <div className="developer-card reveal">
                            <div className="profile-frame">
                                <img
                                    src="/developer.png"
                                    alt="MONSTER LIAR"
                                    className="profile-img"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                            </div>
                            <h3>Created by MONSTER LIAR</h3>
                            <p className="dev-bio">Hi! I'm MONSTER LIAR, a passionate full-stack developer. I built SplitPay to solve the real-world frustrations of unfair bill splitting.</p>

                            <div className="dev-socials">
                                <a href="https://x.com/MONSTER13LIAR" target="_blank" rel="noopener noreferrer">Twitter/X</a>
                                <a href="https://github.com/MONSTER13LIAR" target="_blank" rel="noopener noreferrer">GitHub</a>
                                <a href="https://www.youtube.com/@MONSTER-LIAR" target="_blank" rel="noopener noreferrer">YouTube</a>
                            </div>
                        </div>
                    </div>

                    <footer className="about-footer">
                        <p>Made in India 🇮🇳 | Open Source | Built with ❤️ by MONSTER LIAR</p>
                    </footer>
                </div>
            </section>
        </div>
    );
}
