"use client";

import React from 'react';
import './MobileLayout.css';
import { usePathname } from 'next/navigation';

export default function MobileNavbar() {
    const pathname = usePathname();

    const navItems = [
        { label: 'Dash', icon: '🏠', path: '/dashboard' },
        { label: 'Groups', icon: '👥', path: '/groups' },
        { label: 'Activity', icon: '🔔', path: '/activities' },
        { label: 'Settled', icon: '💸', path: '/settlements' },
        { label: 'Settings', icon: '⚙️', path: '/settings' },
    ];

    return (
        <nav className="mobile-navbar">
            {navItems.map((item) => (
                <a 
                    key={item.path} 
                    href={item.path} 
                    className={`mobile-nav-item ${pathname === item.path ? 'active' : ''}`}
                >
                    <span className="mobile-nav-icon">{item.icon}</span>
                    <span className="mobile-nav-label">{item.label}</span>
                </a>
            ))}
        </nav>
    );
}
