"use client";

import React, { useEffect, useRef } from 'react';
import './dashboard.css';
import { useAuth } from '@/context/AuthContext';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const dashboardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (dashboardRef.current) {
                const { clientX, clientY } = e;
                dashboardRef.current.style.setProperty('--x', `${clientX}px`);
                dashboardRef.current.style.setProperty('--y', `${clientY}px`);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="dashboard-container" ref={dashboardRef}>
            <div className="torch-overlay"></div>
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img src="/logo.jpg" alt="SplitPay" width="40" height="40" style={{ borderRadius: '8px' }} />
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>SplitPay</span>
                </div>

                <nav className="nav-menu">
                    <a href="/dashboard" className="nav-item active">
                        <span>Dashboard</span>
                    </a>
                    <a href="#" className="nav-item">
                        <span>My Groups</span>
                    </a>
                    <a href="#" className="nav-item">
                        <span>Activities</span>
                    </a>
                    <a href="#" className="nav-item">
                        <span>Settlements</span>
                    </a>
                    <a href="#" className="nav-item">
                        <span>Settings</span>
                    </a>
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <button
                        onClick={logout}
                        className="nav-item"
                        style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="dashboard-header">
                    <div className="welcome-text">
                        <h1>Welcome back, {user?.username || user?.first_name || 'Friend'}! 👋</h1>
                        <p>Here's what's happening with your expenses.</p>
                    </div>
                </header>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Total Outstanding</div>
                        <div className="stat-value">₹0.00</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">You are owed</div>
                        <div className="stat-value" style={{ color: '#00e676' }}>₹0.00</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">You owe</div>
                        <div className="stat-value" style={{ color: '#ff3d00' }}>₹0.00</div>
                    </div>
                </div>

                <section className="groups-section">
                    <div className="section-top">
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem' }}>Your Groups</h2>
                        <button className="create-btn">+ Create Group</button>
                    </div>

                    <div className="empty-state">
                        <p>No groups yet. Start by creating one!</p>
                    </div>
                </section>
            </main>
        </div>
    );
}
