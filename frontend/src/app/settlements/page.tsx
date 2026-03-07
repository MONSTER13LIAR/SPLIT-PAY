"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import './settlements.css';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';
import BackgroundParticles from '@/components/BackgroundParticles';
import SplineBackground from '@/components/SplineBackground';

interface SettlementData {
    id: number;
    debtor: { id: number; username: string };
    creditor: { id: number; username: string };
    amount: string;
    group_name: string;
}

interface SettlementRequestData {
    id: number;
    debtor: { id: number; username: string };
    creditor: { id: number; username: string };
    amount: string;
    status: string;
    group_name: string;
}

interface SettlementResponse {
    debts: SettlementData[];
    credits: SettlementData[];
}

interface SettlementRequestsResponse {
    received: SettlementRequestData[];
    sent: SettlementRequestData[];
}

export default function SettlementsPage() {
    const { user, logout } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);
    const [settlements, setSettlements] = useState<SettlementResponse>({ debts: [], credits: [] });
    const [requests, setRequests] = useState<SettlementRequestsResponse>({ received: [], sent: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState<number | null>(null);

    const fetchSettlements = useCallback(async () => {
        try {
            const res = await apiFetch('settlements/');
            if (res.ok) {
                const data = await res.json();
                setSettlements(data);
            }
        } catch (err) { console.error('Failed to fetch settlements:', err); }
    }, []);

    const fetchRequests = useCallback(async () => {
        try {
            const res = await apiFetch('settlement-requests/');
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (err) { console.error('Failed to fetch requests:', err); }
    }, []);

    const fetchAllData = useCallback(async () => {
        await Promise.all([fetchSettlements(), fetchRequests()]);
        setIsLoading(false);
    }, [fetchSettlements, fetchRequests]);

    const handleSettleRequest = async (settlementId: number, amount: string) => {
        if (!confirm(`Send settlement request for ₹${parseFloat(amount).toFixed(2)}?`)) return;
        
        try {
            const res = await apiFetch(`settlements/${settlementId}/mark-settled/`, {
                method: 'POST',
                body: JSON.stringify({ amount }),
            });
            if (res.ok) {
                alert("Settlement request sent! Waiting for creditor confirmation.");
                fetchRequests();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to send request');
            }
        } catch (err) {
            console.error('Error settling:', err);
        }
    };

    const handleRespondRequest = async (requestId: number, action: 'accept' | 'decline') => {
        setIsActionLoading(requestId);
        try {
            const res = await apiFetch(`settlement-requests/${requestId}/respond/`, {
                method: 'POST',
                body: JSON.stringify({ action }),
            });
            if (res.ok) {
                fetchAllData();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to respond');
            }
        } catch (err) {
            console.error('Error responding:', err);
        } finally {
            setIsActionLoading(null);
        }
    };

    useEffect(() => {
        fetchAllData();
        // Poll for updates every 10 seconds
        const interval = setInterval(fetchAllData, 10000);
        return () => clearInterval(interval);
    }, [fetchAllData]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                containerRef.current.style.setProperty('--x', `${e.clientX}px`);
                containerRef.current.style.setProperty('--y', `${e.clientY}px`);
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const totalDebts = settlements.debts.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const totalCredits = settlements.credits.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const netBalance = totalCredits - totalDebts;

    return (
        <div className="settlements-container" ref={containerRef}>
            <SplineBackground />
            <BackgroundParticles />
            <div className="torch-overlay"></div>

            {/* Sidebar Trigger Area */}
            <div className="sidebar-trigger"></div>
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img src="/logo.jpg" alt="SplitPay" width="64" height="64" style={{ borderRadius: '12px' }} />
                    <span style={{ fontWeight: 800, fontSize: '2rem', letterSpacing: '-1px' }}>SplitPay</span>
                </div>
                <nav className="nav-menu">
                    <a href="/dashboard" className="nav-item"><span>Dashboard</span></a>
                    <a href="/groups" className="nav-item"><span>My Groups</span></a>
                    <a href="/activities" className="nav-item"><span>Activities</span></a>
                    <a href="/settlements" className="nav-item active"><span>Settlements</span></a>
                    <a href="/settings" className="nav-item"><span>Settings</span></a>
                </nav>
                <div style={{ marginTop: 'auto' }}>
                    <button onClick={logout} className="nav-item" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="sp-main">
                <div className="sp-header">
                    <div className="welcome-text">
                        <h1 style={{ fontSize: '3.2rem', marginBottom: '0.5rem' }}>Global Settlements</h1>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem' }}>Track your net balance across all group activities.</p>
                    </div>
                    
                    <div className="sp-balance-card">
                        <div className="sp-balance-item">
                            <label>Net Balance</label>
                            <span className={`sp-balance-value ${netBalance >= 0 ? 'positive' : 'negative'}`}>
                                ₹{Math.abs(netBalance).toFixed(2)}
                                <small style={{ fontSize: '0.9rem', marginLeft: '8px', opacity: 0.7, fontWeight: 400 }}>
                                    {netBalance >= 0 ? ' (Owed to you)' : ' (You owe)'}
                                </small>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="sp-grid">
                    {/* Settlement Requests (Notifications) */}
                    {(requests.received.length > 0 || requests.sent.length > 0) && (
                        <section className="sp-section full-width">
                            <h2>🔔 Settlement Requests</h2>
                            <div className="sp-requests-list">
                                {requests.received.map(req => (
                                    <div key={req.id} className="sp-card sp-request-received">
                                        <div className="sp-card-info">
                                            <div className="sp-req-header">
                                                <span className="sp-req-tag received">ACTION REQUIRED</span>
                                                <span className="sp-group">{req.group_name}</span>
                                            </div>
                                            <div className="sp-req-body">
                                                <span className="sp-username">@{req.debtor.username}</span>
                                                <span className="sp-req-text">paid you ₹{parseFloat(req.amount).toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="sp-req-actions">
                                            <button 
                                                className="sp-btn accept"
                                                onClick={() => handleRespondRequest(req.id, 'accept')}
                                                disabled={isActionLoading === req.id}
                                            >
                                                Confirm
                                            </button>
                                            <button 
                                                className="sp-btn decline"
                                                onClick={() => handleRespondRequest(req.id, 'decline')}
                                                disabled={isActionLoading === req.id}
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {requests.sent.map(req => (
                                    <div key={req.id} className="sp-card sp-request-sent">
                                        <div className="sp-card-info">
                                            <div className="sp-req-header">
                                                <span className="sp-req-tag sent">PENDING</span>
                                                <span className="sp-group">{req.group_name}</span>
                                            </div>
                                            <div className="sp-req-body">
                                                <span className="sp-req-text">Waiting for <strong>@{req.creditor.username}</strong> to confirm your payment of ₹{parseFloat(req.amount).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Debts Section */}
                    <section className="sp-section">
                        <h2>💸 You Owe Money</h2>
                        {settlements.debts.length === 0 ? (
                            <div className="sp-empty-card">You're all settled up! 🎉</div>
                        ) : (
                            <div className="sp-list">
                                {settlements.debts.map(s => (
                                    <div key={s.id} className="sp-card sp-debt">
                                        <div className="sp-card-info">
                                            <span className="sp-username">@{s.creditor.username}</span>
                                            <span className="sp-group">in {s.group_name}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                            <span className="sp-amount">₹{parseFloat(s.amount).toFixed(2)}</span>
                                            <button 
                                                className="sp-settle-btn"
                                                onClick={() => handleSettleRequest(s.id, s.amount)}
                                            >
                                                Settle
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Credits Section */}
                    <section className="sp-section">
                        <h2>💰 You're Owed Money</h2>
                        {settlements.credits.length === 0 ? (
                            <div className="sp-empty-card">No one owes you right now.</div>
                        ) : (
                            <div className="sp-list">
                                {settlements.credits.map(s => (
                                    <div key={s.id} className="sp-card sp-credit">
                                        <div className="sp-card-info">
                                            <span className="sp-username">@{s.debtor.username}</span>
                                            <span className="sp-group">in {s.group_name}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                            <span className="sp-amount">₹{parseFloat(s.amount).toFixed(2)}</span>
                                            <div className="sp-waiting-tag">Waiting for payment</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
