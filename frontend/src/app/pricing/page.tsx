"use client";

import React from 'react';
import './pricing.css';
import '../login/login.css'; // Importing login.css for the navbar styles
import { getGoogleAuthUrl } from '@/utils/auth';

export default function PricingPage() {
    const handleGoogleLogin = () => {
        window.location.href = getGoogleAuthUrl();
    };

    return (
        <div className="pricing-container">
            {/* Navbar (Same as Login/Home) */}
            <nav className="premium-navbar">
                <div className="nav-content">
                    <div className="nav-left" onClick={() => window.location.href = '/login'}>
                        <img src="/logo.jpg" alt="SplitPay Logo" className="nav-logo" style={{ cursor: 'pointer' }} />
                        <span className="nav-brand" style={{ cursor: 'pointer' }}>SplitPay</span>
                    </div>
                    <div className="nav-center">
                        <a href="/login" className="nav-link">Home</a>
                        <a href="/login#about" className="nav-link">About</a>
                        <a href="/pricing" className="nav-link active">Pricing</a>
                    </div>
                    <div className="nav-right">
                        <button className="nav-cta" onClick={handleGoogleLogin}>Get Started</button>
                    </div>
                </div>
            </nav>

            <div className="pricing-content">
                <header className="pricing-header">
                    <h1 className="pricing-title">Simple Pricing</h1>
                    <p className="pricing-subtitle">Everything you need, nothing you don't.</p>
                </header>

                <div className="pricing-card">
                    <div className="plan-name">Founders Plan</div>
                    <div className="plan-price">Free<span> / Forever</span></div>

                    <ul className="feature-list">
                        <li>Turn-Based Payment Automatic Assignment</li>
                        <li>Smart Category Splitting (Veg/Non-veg/Alcohol)</li>
                        <li>Democratic Group Voting System</li>
                        <li>Real-time Debt Settlement Tracking</li>
                        <li>Intuitive Dashboard for Groups</li>
                        <li>Unlimited Groups and members</li>
                        <li>Secure Google OAuth Integration</li>
                    </ul>

                    <button className="pricing-cta" onClick={handleGoogleLogin}>
                        Start Splitting Now
                    </button>
                </div>
            </div>

            <footer style={{ marginTop: 'auto', padding: '2rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
                © 2026 SplitPay | Built by MONSTER LIAR
            </footer>
        </div>
    );
}
