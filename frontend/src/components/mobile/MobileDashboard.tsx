"use client";

import React from 'react';
import MobileNavbar from './MobileNavbar';
import './MobileLayout.css';

interface MobileDashboardProps {
    user: any;
    groups: any[];
    invitations: any[];
    settlements: { debts: any[], credits: any[] };
    setShowCreateGroup: (show: boolean) => void;
    handleRespondInvitation: (id: number, action: 'accept' | 'decline') => void;
    respondingId: number | null;
}

export default function MobileDashboard({
    user,
    groups,
    invitations,
    settlements,
    setShowCreateGroup,
    handleRespondInvitation,
    respondingId
}: MobileDashboardProps) {
    const totalDebts = settlements.debts.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const totalCredits = settlements.credits.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const netBalance = totalCredits - totalDebts;

    return (
        <div className="mobile-container">
            <header className="mobile-header">
                <h1>Hi, {user?.username || 'Friend'}! 👋</h1>
                <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Welcome to SplitPay</p>
            </header>

            <main className="mobile-content">
                <div className="mobile-card" style={{ borderLeft: `4px solid ${netBalance >= 0 ? '#00e676' : '#ff3d00'}` }}>
                    <div className="mobile-stat-row">
                        <span>Net Balance</span>
                        <span className="mobile-stat-val" style={{ color: netBalance >= 0 ? '#00e676' : '#ff3d00' }}>
                            ₹{Math.abs(netBalance).toFixed(2)}
                        </span>
                    </div>
                    <div className="mobile-stat-row" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        <span>{netBalance >= 0 ? 'Owed to you' : 'You owe'}</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="mobile-card">
                        <p style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '5px' }}>Owed to you</p>
                        <p style={{ fontWeight: 800, color: '#00e676' }}>₹{totalCredits.toFixed(2)}</p>
                    </div>
                    <div className="mobile-card">
                        <p style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '5px' }}>You owe</p>
                        <p style={{ fontWeight: 800, color: '#ff3d00' }}>₹{totalDebts.toFixed(2)}</p>
                    </div>
                </div>

                {invitations.length > 0 && (
                    <div className="mobile-section" style={{ marginTop: '10px' }}>
                        <h2 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Invitations ({invitations.length})</h2>
                        {invitations.map(inv => (
                            <div key={inv.id} className="mobile-card">
                                <p><strong>{inv.group.name}</strong></p>
                                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>from @{inv.invited_by.username}</p>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button 
                                        className="mobile-btn mobile-btn-primary" 
                                        style={{ background: '#00e676', flex: 1, padding: '8px' }}
                                        onClick={() => handleRespondInvitation(inv.id, 'accept')}
                                        disabled={respondingId === inv.id}
                                    >
                                        Accept
                                    </button>
                                    <button 
                                        className="mobile-btn" 
                                        style={{ background: 'rgba(255,255,255,0.1)', flex: 1, padding: '8px', color: '#fff' }}
                                        onClick={() => handleRespondInvitation(inv.id, 'decline')}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h2 style={{ fontSize: '1.1rem' }}>Groups</h2>
                        <button 
                            onClick={() => setShowCreateGroup(true)}
                            style={{ background: '#8a2be2', border: 'none', color: '#fff', borderRadius: '50%', width: '30px', height: '30px', fontSize: '1.2rem', fontWeight: 800 }}
                        >
                            +
                        </button>
                    </div>
                    
                    {groups.length === 0 ? (
                        <div className="mobile-card" style={{ textAlign: 'center', opacity: 0.6 }}>
                            <p>No groups yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {groups.map(group => (
                                <div 
                                    key={group.id} 
                                    className="mobile-card" 
                                    style={{ margin: 0 }}
                                    onClick={() => window.location.href = '/groups'}
                                >
                                    <p style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.name}</p>
                                    <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>{group.members.length} members</p>
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
