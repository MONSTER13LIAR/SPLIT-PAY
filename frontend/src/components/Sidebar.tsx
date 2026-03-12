"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Close sidebar on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    if (!isAuthenticated || !user) return null;

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
        { name: 'My Groups', path: '/groups', icon: '👥' },
        { name: 'Activities', path: '/activities', icon: '📋' },
        { name: 'Settlements', path: '/settlements', icon: '💰' },
        { name: 'Settings', path: '/settings', icon: '⚙️' },
    ];

    return (
        <>
            {/* Mobile Header with Hamburger */}
            <header className="mobile-header">
                <div className="mobile-logo">
                    <img src="/logo.jpg" alt="SplitPay" width="32" height="32" />
                    <span>SplitPay</span>
                </div>
                <button 
                    className={`hamburger-btn ${isOpen ? 'open' : ''}`} 
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle Menu"
                >
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                </button>
            </header>

            {/* Sidebar Overlay for Mobile */}
            <div 
                className={`sidebar-overlay ${isOpen ? 'show' : ''}`} 
                onClick={() => setIsOpen(false)}
            ></div>

            {/* Sidebar Container */}
            <aside className={`sidebar-container ${isOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-logo">
                    <img src="/logo.jpg" alt="SplitPay" width="64" height="64" />
                    <span>SplitPay</span>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <a 
                            key={item.path}
                            href={item.path} 
                            className={`sidebar-nav-item ${pathname === item.path ? 'active' : ''}`}
                        >
                            <span className="sidebar-nav-icon">{item.icon}</span>
                            <span className="sidebar-nav-text">{item.name}</span>
                        </a>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button onClick={logout} className="sidebar-logout-btn">
                        <span className="sidebar-nav-icon">🚪</span>
                        <span className="sidebar-nav-text">Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
