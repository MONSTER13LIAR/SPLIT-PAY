"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';
import './settings.css';

export default function SettingsPage() {
    const { user, logout, login, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    
    const [isNonVeg, setIsNonVeg] = useState(user?.is_non_veg || false);
    const [isDrinker, setIsDrinker] = useState(user?.is_drinker || false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (user) {
            setIsNonVeg(user.is_non_veg);
            setIsDrinker(user.is_drinker);
        }
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        setMessage({ text: '', type: '' });
        try {
            const res = await apiFetch('update-preferences/', {
                method: 'PATCH',
                body: JSON.stringify({
                    is_non_veg: isNonVeg,
                    is_drinker: isDrinker
                }),
            });

            if (res.ok) {
                const updatedUser = await res.json();
                // Update local auth context
                login(updatedUser);
                setMessage({ text: 'Preferences updated successfully! ✨', type: 'success' });
            } else {
                setMessage({ text: 'Failed to update preferences.', type: 'error' });
            }
        } catch (err) {
            setMessage({ text: 'Network error. Please try again.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (isLoading || !user) {
        return (
            <div style={{ 
                height: '100vh', 
                background: '#0d0d0d', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#fff',
                fontFamily: 'Inter, sans-serif'
            }}>
                Loading settings...
            </div>
        );
    }

    return (
        <div className="settings-container">
            <main className="settings-main">
                <div className="settings-card">
                    <header className="settings-header">
                        <h1>Account Settings</h1>
                        <p>Manage your profile and preferences</p>
                    </header>

                    <div className="settings-content">
                        <div className="setting-group">
                            <label>Username</label>
                            <div className="read-only-input">
                                <span className="prefix">@</span>
                                <input type="text" value={user.username} readOnly disabled />
                                <span className="lock-icon">🔒</span>
                            </div>
                            <p className="field-hint">Usernames cannot be changed once set.</p>
                        </div>

                        <div className="setting-group">
                            <label>Dietary & Social Preferences</label>
                            <div className="preferences-list">
                                <div className="preference-item">
                                    <div className="pref-info">
                                        <h3>Non-Vegetarian</h3>
                                        <p>Toggle if you eat non-veg food</p>
                                    </div>
                                    <label className="switch">
                                        <input 
                                            type="checkbox" 
                                            checked={isNonVeg}
                                            onChange={(e) => setIsNonVeg(e.target.checked)}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>

                                <div className="preference-item">
                                    <div className="pref-info">
                                        <h3>Drinker</h3>
                                        <p>Toggle if you consume alcohol</p>
                                    </div>
                                    <label className="switch">
                                        <input 
                                            type="checkbox" 
                                            checked={isDrinker}
                                            onChange={(e) => setIsDrinker(e.target.checked)}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {message.text && (
                            <div className={`status-message ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        <button 
                            className="save-settings-btn"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
