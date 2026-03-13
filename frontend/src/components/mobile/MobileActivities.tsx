"use client";

import React from 'react';
import MobileNavbar from './MobileNavbar';
import './MobileLayout.css';

interface MobileActivitiesProps {
    setShowVoteModal: (show: boolean) => void;
}

export default function MobileActivities({
    setShowVoteModal
}: MobileActivitiesProps) {
    return (
        <div className="mobile-container">
            <header className="mobile-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1>Activities</h1>
                    <button 
                        onClick={() => setShowVoteModal(true)}
                        style={{ background: '#ff3d00', border: 'none', color: '#fff', borderRadius: '12px', padding: '8px 16px', fontSize: '0.9rem', fontWeight: 800 }}
                    >
                        Vote Out
                    </button>
                </div>
            </header>

            <main className="mobile-content">
                <div className="mobile-card" style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.6 }}>
                    <p style={{ fontSize: '3rem', marginBottom: '15px' }}>📜</p>
                    <p style={{ fontWeight: 600 }}>No recent activities</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '10px' }}>Your activity history will appear here.</p>
                </div>
            </main>

            <MobileNavbar />
        </div>
    );
}
