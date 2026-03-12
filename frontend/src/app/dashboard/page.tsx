"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import './dashboard.css';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';
import BackgroundParticles from '@/components/BackgroundParticles';
import SplineBackground from '@/components/SplineBackground';
import SetUsernameModal from '@/components/SetUsernameModal';
import CreateGroupModal from '@/components/CreateGroupModal';

interface GroupData {
    id: number;
    name: string;
    description: string;
    members: { id: number; username: string }[];
    created_by: { id: number; username: string } | null;
    created_at: string;
}

interface InvitationData {
    id: number;
    group: GroupData;
    invited_by: { id: number; username: string };
    status: string;
    created_at: string;
}

interface SettlementData {
    id: number;
    debtor: { id: number; username: string };
    creditor: { id: number; username: string };
    amount: string;
    group_name: string;
}

interface SettlementResponse {
    debts: SettlementData[];
    credits: SettlementData[];
}

export default function Dashboard() {
    const { user, logout, updateUser, isLoading } = useAuth();
    const dashboardRef = useRef<HTMLDivElement>(null);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [invitations, setInvitations] = useState<InvitationData[]>([]);
    const [settlements, setSettlements] = useState<SettlementResponse>({ debts: [], credits: [] });
    const [respondingId, setRespondingId] = useState<number | null>(null);
    const [showInviteModal, setShowInviteModal] = useState<number | null>(null);
    const [showExitModal, setShowExitModal] = useState<number | null>(null);
    const [statusModal, setStatusModal] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [inviteUsername, setInviteUsername] = useState('');
    const [inviteError, setInviteError] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);

    const fetchGroups = useCallback(async () => {
        try {
            const res = await apiFetch('groups/');
            if (res.ok) {
                const data = await res.json();
                setGroups(data);
            }
        } catch (err) {
            console.error('Failed to fetch groups:', err);
        }
    }, []);

    const fetchInvitations = useCallback(async () => {
        try {
            const res = await apiFetch('invitations/');
            if (res.ok) {
                const data = await res.json();
                setInvitations(data);
            }
        } catch (err) {
            console.error('Failed to fetch invitations:', err);
        }
    }, []);

    const fetchSettlements = useCallback(async () => {
        try {
            const res = await apiFetch('settlements/');
            if (res.ok) {
                const data = await res.json();
                setSettlements(data);
            }
        } catch (err) { console.error('Failed to fetch settlements:', err); }
    }, []);

    useEffect(() => {
        if (!isLoading && user) {
            fetchGroups();
            fetchInvitations();
            fetchSettlements();
        }
    }, [isLoading, user, fetchGroups, fetchInvitations, fetchSettlements]);

    useEffect(() => {
        if (!isLoading && !user) {
            window.location.href = '/login';
        }
    }, [isLoading, user]);

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

    const handleRespondInvitation = async (invitationId: number, action: 'accept' | 'decline') => {
        setRespondingId(invitationId);
        try {
            const res = await apiFetch(`invitations/${invitationId}/respond/`, {
                method: 'POST',
                body: JSON.stringify({ action }),
            });
            if (res.ok) {
                fetchGroups();
                fetchInvitations();
            }
        } catch (err) {
            console.error('Failed to respond to invitation:', err);
        }
        setRespondingId(null);
    };

    const handleExitGroup = async () => {
        if (!showExitModal) return;
        try {
            const res = await apiFetch(`groups/${showExitModal}/exit/`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setStatusModal({ type: 'success', message: "Successfully left the group. You can rejoin later via invitation if you have no debts." });
                fetchGroups();
                setShowExitModal(null);
            } else {
                setStatusModal({ type: 'error', message: data.error || "Failed to leave group." });
            }
        } catch (err) { console.error(err); }
    };

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showInviteModal || !inviteUsername.trim()) return;
        setInviteLoading(true);
        setInviteError('');
        try {
            const res = await apiFetch(`groups/${showInviteModal}/invite-member/`, {
                method: 'POST',
                body: JSON.stringify({ username: inviteUsername.trim() })
            });
            const data = await res.json();
            if (res.ok) {
                setStatusModal({ type: 'success', message: data.message || "Invitation sent successfully!" });
                setShowInviteModal(null);
                setInviteUsername('');
            } else {
                setInviteError(data.error || "Failed to send invitation.");
            }
        } catch (err) { setInviteError("Network error."); }
        finally { setInviteLoading(false); }
    };

    if (isLoading) {
        return (
            <div style={{
                height: '100vh',
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div className="spinner" style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(255,255,255,0.1)',
                    borderTopColor: '#8a2be2',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
            </div>
        );
    }

    if (!user) return null;

    const totalDebts = settlements.debts.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const totalCredits = settlements.credits.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const netBalance = totalCredits - totalDebts;

    return (
        <div className="dashboard-container" ref={dashboardRef}>
            <SplineBackground />
            <BackgroundParticles />
            <div className="torch-overlay"></div>

            {user && !user.has_set_username && (
                <SetUsernameModal onUsernameSet={(updatedUser) => updateUser(updatedUser)} />
            )}

            {showCreateGroup && (
                <CreateGroupModal onClose={() => setShowCreateGroup(false)} onGroupCreated={() => { fetchGroups(); }} />
            )}

            {showInviteModal && (
                <div className="invite-modal-overlay" onClick={() => setShowInviteModal(null)}>
                    <div className="invite-modal" onClick={e => e.stopPropagation()}>
                        <button className="v-close" onClick={() => setShowInviteModal(null)}>&times;</button>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👤</div>
                            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.5rem' }}>Invite Member</h3>
                            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
                                to <strong>{groups.find(g => g.id === showInviteModal)?.name}</strong>
                            </p>
                        </div>
                        <form onSubmit={handleInviteMember}>
                            <input 
                                type="text" 
                                placeholder="Enter username" 
                                value={inviteUsername}
                                onChange={e => setInviteUsername(e.target.value)}
                                autoFocus
                                style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', marginBottom: '1rem' }}
                            />
                            {inviteError && <p style={{ color: '#ff3d00', fontSize: '0.85rem', marginBottom: '1rem' }}>{inviteError}</p>}
                            <button type="submit" disabled={inviteLoading} style={{ width: '100%', padding: '1rem', background: '#8a2be2', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>
                                {inviteLoading ? 'Sending...' : 'Send Invitation'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showExitModal && (
                <div className="invite-modal-overlay" onClick={() => setShowExitModal(null)}>
                    <div className="invite-modal" onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>⚠️</div>
                            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', marginBottom: '0.75rem', color: '#ff3d00' }}>Wait! Are you sure?</h3>
                            <div style={{ background: 'rgba(255, 61, 0, 0.1)', border: '1px solid rgba(255, 61, 0, 0.2)', borderRadius: '16px', padding: '1.25rem', marginBottom: '2rem' }}>
                                <p style={{ color: '#ff9d80', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                    You are about to leave <strong>{groups.find(g => g.id === showExitModal)?.name}</strong>.<br/>
                                    <span style={{ display: 'block', marginTop: '0.5rem', opacity: 0.8 }}>
                                        Note: You can only leave if you have <strong>no outstanding debts or credits</strong>. You can rejoin later via invitation once settled.
                                    </span>
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setShowExitModal(null)} style={{ flex: 1, padding: '1.1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}>Go Back</button>
                                <button onClick={handleExitGroup} style={{ flex: 1, padding: '1.1rem', background: '#ff3d00', border: 'none', borderRadius: '16px', color: '#fff', cursor: 'pointer', fontWeight: '800', transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(255, 61, 0, 0.2)' }}>Confirm Exit</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {statusModal && (
                <div className="invite-modal-overlay" onClick={() => setStatusModal(null)}>
                    <div className="invite-modal" style={{ width: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
                            {statusModal.type === 'success' ? '✅' : '❌'}
                        </div>
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', marginBottom: '1rem' }}>
                            {statusModal.type === 'success' ? 'Success!' : 'Oops!'}
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem', fontSize: '1rem' }}>{statusModal.message}</p>
                        <button 
                            onClick={() => setStatusModal(null)} 
                            style={{ 
                                width: '100%', 
                                padding: '1rem', 
                                background: statusModal.type === 'success' ? '#00e676' : '#ff3d00', 
                                border: 'none', 
                                borderRadius: '16px', 
                                color: '#fff', 
                                fontWeight: '800', 
                                cursor: 'pointer' 
                            }}
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}

            <main className="main-content">
                <header className="dashboard-header">
                    <div className="welcome-text">
                        <h1>Welcome back, {user?.username || user?.first_name || 'Friend'}! 👋</h1>
                        <p>Here&apos;s what&apos;s happening with your expenses.</p>
                    </div>
                </header>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Net Balance</div>
                        <div className="stat-value" style={{ color: netBalance >= 0 ? '#00e676' : '#ff3d00' }}>
                            ₹{Math.abs(netBalance).toFixed(2)}
                            <span style={{ fontSize: '0.8rem', marginLeft: '5px', opacity: 0.7 }}>
                                {netBalance >= 0 ? ' (Owed to you)' : ' (You owe)'}
                            </span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">You are owed</div>
                        <div className="stat-value" style={{ color: '#00e676' }}>₹{totalCredits.toFixed(2)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">You owe</div>
                        <div className="stat-value" style={{ color: '#ff3d00' }}>₹{totalDebts.toFixed(2)}</div>
                    </div>
                </div>

                {invitations.length > 0 && (
                    <section className="invitations-section">
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', marginBottom: '1.25rem' }}>Pending Invitations</h2>
                        <div className="invitations-list">
                            {invitations.map(inv => (
                                <div key={inv.id} className="invitation-card">
                                    <div className="invitation-info">
                                        <span className="invitation-group-name">{inv.group.name}</span>
                                        <span className="invitation-from">invited by <strong>@{inv.invited_by.username}</strong></span>
                                    </div>
                                    <div className="invitation-actions">
                                        <button className="inv-btn inv-accept" disabled={respondingId === inv.id} onClick={() => handleRespondInvitation(inv.id, 'accept')}>Accept</button>
                                        <button className="inv-btn inv-decline" disabled={respondingId === inv.id} onClick={() => handleRespondInvitation(inv.id, 'decline')}>Decline</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="groups-section">
                    <div className="section-top">
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem' }}>Your Groups</h2>
                        <button className="create-btn" onClick={() => setShowCreateGroup(true)}>+ Create Group</button>
                    </div>

                    {groups.length === 0 ? (
                        <div className="empty-state">
                            <p>No groups yet. Start by creating one!</p>
                        </div>
                    ) : (
                        <div className="groups-grid">
                            {groups.map(group => (
                                <div key={group.id} className="group-card" style={{ position: 'relative' }} onClick={() => window.location.href = '/groups'}>
                                    <div className="gp-card-actions" onClick={e => e.stopPropagation()}>
                                        <button className="gp-action-btn invite" title="Add Member" onClick={() => setShowInviteModal(group.id)}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                        </button>
                                        <button className="gp-action-btn exit" title="Exit Group" onClick={() => setShowExitModal(group.id)}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                        </button>
                                    </div>
                                    <h3 className="group-card-name">{group.name}</h3>
                                    <p className="group-card-members">{group.members.length} member{group.members.length !== 1 ? 's' : ''}</p>
                                    <div className="group-card-avatars">
                                        {group.members.slice(0, 5).map(m => (
                                            <span key={m.id} className="group-avatar" title={m.username}>{m.username[0].toUpperCase()}</span>
                                        ))}
                                        {group.members.length > 5 && <span className="group-avatar group-avatar-more">+{group.members.length - 5}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
