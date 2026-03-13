"use client";

import React from 'react';
import MobileNavbar from './MobileNavbar';
import './MobileLayout.css';

interface MobileSettlementsProps {
    settlements: { debts: any[], credits: any[] };
    requests: { received: any[], sent: any[] };
    handleSettleRequest: (id: number, amount: string) => void;
    handleRespondRequest: (id: number, action: 'accept' | 'decline') => void;
    isActionLoading: number | null;
}

export default function MobileSettlements({
    settlements,
    requests,
    handleSettleRequest,
    handleRespondRequest,
    isActionLoading
}: MobileSettlementsProps) {
    const totalDebts = settlements.debts.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const totalCredits = settlements.credits.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const netBalance = totalCredits - totalDebts;

    return (
        <div className="mobile-container">
            <header className="mobile-header">
                <h1>Settlements</h1>
                <div style={{ marginTop: '10px' }}>
                    <div className="mobile-stat-row">
                        <span style={{ opacity: 0.7 }}>Net Balance</span>
                        <span className="mobile-stat-val" style={{ color: netBalance >= 0 ? '#00e676' : '#ff3d00', fontSize: '1.4rem' }}>
                            ₹{Math.abs(netBalance).toFixed(2)}
                        </span>
                    </div>
                    <p style={{ fontSize: '0.7rem', opacity: 0.5, textAlign: 'right' }}>
                        {netBalance >= 0 ? 'Owed to you' : 'You owe'}
                    </p>
                </div>
            </header>

            <main className="mobile-content">
                {(requests.received.length > 0 || requests.sent.length > 0) && (
                    <div className="mobile-section">
                        <h2 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>🔔 Requests</h2>
                        {requests.received.map((req: any) => (
                            <div key={req.id} className="mobile-card" style={{ borderLeft: '4px solid #8a2be2' }}>
                                <p style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '5px' }}>{req.group_name}</p>
                                <p><strong>@{req.debtor.username}</strong> paid you <strong>₹{parseFloat(req.amount).toFixed(2)}</strong></p>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button 
                                        className="mobile-btn" 
                                        style={{ background: '#00e676', flex: 1, padding: '8px', color: '#fff' }}
                                        onClick={() => handleRespondRequest(req.id, 'accept')}
                                        disabled={isActionLoading === req.id}
                                    >
                                        Confirm
                                    </button>
                                    <button 
                                        className="mobile-btn" 
                                        style={{ background: 'rgba(255,255,255,0.1)', flex: 1, padding: '8px', color: '#fff' }}
                                        onClick={() => handleRespondRequest(req.id, 'decline')}
                                        disabled={isActionLoading === req.id}
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                        {requests.sent.map((req: any) => (
                            <div key={req.id} className="mobile-card" style={{ opacity: 0.8 }}>
                                <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>{req.group_name}</p>
                                <p style={{ fontSize: '0.85rem' }}>Waiting for <strong>@{req.creditor.username}</strong> to confirm ₹{parseFloat(req.amount).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mobile-section" style={{ marginTop: '10px' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>💸 You Owe</h2>
                    {settlements.debts.length === 0 ? (
                        <div className="mobile-card" style={{ textAlign: 'center', opacity: 0.6 }}>Settled! 🎉</div>
                    ) : (
                        settlements.debts.map((s: any) => (
                            <div key={s.id} className="mobile-card">
                                <div className="mobile-stat-row">
                                    <div>
                                        <p style={{ fontWeight: 700 }}>@{s.creditor.username}</p>
                                        <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>{s.group_name}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: 800, color: '#ff3d00' }}>₹{parseFloat(s.amount).toFixed(2)}</p>
                                        <button 
                                            className="mobile-btn" 
                                            style={{ background: '#8a2be2', padding: '4px 12px', fontSize: '0.7rem', marginTop: '5px', color: '#fff' }}
                                            onClick={() => handleSettleRequest(s.id, s.amount)}
                                        >
                                            Settle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mobile-section" style={{ marginTop: '10px' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>💰 You&apos;re Owed</h2>
                    {settlements.credits.length === 0 ? (
                        <div className="mobile-card" style={{ textAlign: 'center', opacity: 0.6 }}>No credits.</div>
                    ) : (
                        settlements.credits.map((s: any) => (
                            <div key={s.id} className="mobile-card">
                                <div className="mobile-stat-row">
                                    <div>
                                        <p style={{ fontWeight: 700 }}>@{s.debtor.username}</p>
                                        <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>{s.group_name}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: 800, color: '#00e676' }}>₹{parseFloat(s.amount).toFixed(2)}</p>
                                        <p style={{ fontSize: '0.6rem', opacity: 0.5 }}>Waiting...</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            <MobileNavbar />
        </div>
    );
}
