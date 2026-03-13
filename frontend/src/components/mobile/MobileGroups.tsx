"use client";

import React from 'react';
import MobileNavbar from './MobileNavbar';
import './MobileLayout.css';

interface MobileGroupsProps {
    groups: any[];
    invitations: any[];
    setShowCreateGroup: (show: boolean) => void;
    setSelectedGroupId: (id: number | null) => void;
    handleRespond: (id: number, action: 'accept' | 'decline') => void;
    respondingId: number | null;
}

export default function MobileGroups({
    groups,
    invitations,
    setShowCreateGroup,
    setSelectedGroupId,
    handleRespond,
    respondingId
}: MobileGroupsProps) {
    return (
        <div className="mobile-container">
            <header className="mobile-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1>My Groups</h1>
                    <button 
                        onClick={() => setShowCreateGroup(true)}
                        style={{ background: '#8a2be2', border: 'none', color: '#fff', borderRadius: '50%', width: '35px', height: '35px', fontSize: '1.4rem', fontWeight: 800 }}
                    >
                        +
                    </button>
                </div>
            </header>

            <main className="mobile-content">
                {invitations.length > 0 && (
                    <div className="mobile-section">
                        <h2 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Pending Invitations ({invitations.length})</h2>
                        {invitations.map(inv => (
                            <div key={inv.id} className="mobile-card">
                                <p><strong>{inv.group.name}</strong></p>
                                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>from @{inv.invited_by.username}</p>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button 
                                        className="mobile-btn" 
                                        style={{ background: '#00e676', flex: 1, padding: '8px', color: '#fff' }}
                                        onClick={() => handleRespond(inv.id, 'accept')}
                                        disabled={respondingId === inv.id}
                                    >
                                        Accept
                                    </button>
                                    <button 
                                        className="mobile-btn" 
                                        style={{ background: 'rgba(255,255,255,0.1)', flex: 1, padding: '8px', color: '#fff' }}
                                        onClick={() => handleRespond(inv.id, 'decline')}
                                        disabled={respondingId === inv.id}
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mobile-section" style={{ marginTop: '10px' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Your Groups</h2>
                    {groups.length === 0 ? (
                        <div className="mobile-card" style={{ textAlign: 'center', opacity: 0.6, padding: '40px 20px' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '10px' }}>📂</p>
                            <p>No groups yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {groups.map(group => (
                                <div 
                                    key={group.id} 
                                    className="mobile-card" 
                                    onClick={() => setSelectedGroupId(group.id)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{group.name}</p>
                                            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{group.members.length} members</p>
                                        </div>
                                        <div style={{ fontSize: '1.2rem' }}>➡️</div>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
                                        {group.members.slice(0, 3).map((m: any) => (
                                            <span key={m.id} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                                                @{m.username}
                                            </span>
                                        ))}
                                        {group.members.length > 3 && (
                                            <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>+{group.members.length - 3} more</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <MobileNavbar />
        </div>
    );
}
