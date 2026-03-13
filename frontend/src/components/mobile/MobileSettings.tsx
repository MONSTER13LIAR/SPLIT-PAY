"use client";

import React from 'react';
import MobileNavbar from './MobileNavbar';
import './MobileLayout.css';

interface MobileSettingsProps {
    user: any;
    isNonVeg: boolean;
    setIsNonVeg: (val: boolean) => void;
    isDrinker: boolean;
    setIsDrinker: (val: boolean) => void;
    handleSave: () => void;
    logout: () => void;
    loading: boolean;
    message: { text: string, type: string };
}

export default function MobileSettings({
    user,
    isNonVeg,
    setIsNonVeg,
    isDrinker,
    setIsDrinker,
    handleSave,
    logout,
    loading,
    message
}: MobileSettingsProps) {
    return (
        <div className="mobile-container">
            <header className="mobile-header">
                <h1>Settings</h1>
            </header>

            <main className="mobile-content">
                <div className="mobile-card">
                    <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '5px' }}>Username</p>
                    <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>@{user?.username}</p>
                </div>

                <div className="mobile-section" style={{ marginTop: '20px' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Preferences</h2>
                    
                    <div className="mobile-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontWeight: 600 }}>Non-Vegetarian</p>
                                <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>Eat non-veg food</p>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={isNonVeg}
                                onChange={(e) => setIsNonVeg(e.target.checked)}
                                style={{ width: '24px', height: '24px' }}
                            />
                        </div>
                    </div>

                    <div className="mobile-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontWeight: 600 }}>Drinker</p>
                                <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>Consume alcohol</p>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={isDrinker}
                                onChange={(e) => setIsDrinker(e.target.checked)}
                                style={{ width: '24px', height: '24px' }}
                            />
                        </div>
                    </div>
                </div>

                {message.text && (
                    <div className="mobile-card" style={{ 
                        background: message.type === 'success' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 61, 0, 0.1)',
                        borderColor: message.type === 'success' ? '#00e676' : '#ff3d00',
                        textAlign: 'center'
                    }}>
                        <p style={{ fontSize: '0.9rem', color: message.type === 'success' ? '#00e676' : '#ff3d00' }}>
                            {message.text}
                        </p>
                    </div>
                )}

                <button 
                    className="mobile-btn mobile-btn-primary" 
                    onClick={handleSave}
                    disabled={loading}
                    style={{ marginTop: '10px' }}
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>

                <button 
                    className="mobile-btn" 
                    onClick={logout}
                    style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#ff3d00', marginTop: '20px', border: '1px solid rgba(255, 61, 0, 0.2)' }}
                >
                    Logout
                </button>
            </main>

            <MobileNavbar />
        </div>
    );
}
