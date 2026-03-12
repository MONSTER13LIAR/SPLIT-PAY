"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import './groups.css';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';
import BackgroundParticles from '@/components/BackgroundParticles';
import SplineBackground from '@/components/SplineBackground';
import CreateGroupModal from '@/components/CreateGroupModal';
import GroupDetailModal from '@/components/GroupDetailModal';

interface User {
    id: number;
    username: string;
}

interface GroupData {
    id: number;
    name: string;
    description: string;
    members: User[];
    created_by: User | null;
    member_order: number[];
    current_turn_index: number;
    created_at: string;
}

interface InvitationData {
    id: number;
    group: GroupData;
    invited_by: User;
    status: string;
    created_at: string;
}

export default function GroupsPage() {
    const { user, logout, isLoading } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [invitations, setInvitations] = useState<InvitationData[]>([]);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
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
        } catch (err) { console.error('Failed to fetch groups:', err); }
    }, []);

    const fetchInvitations = useCallback(async () => {
        try {
            const res = await apiFetch('invitations/');
            if (res.ok) {
                const data = await res.json();
                setInvitations(data);
            }
        } catch (err) { console.error('Failed to fetch invitations:', err); }
    }, []);

    const handleRespond = async (invId: number, action: 'accept' | 'decline') => {
        setRespondingId(invId);
        try {
            const res = await apiFetch(`invitations/${invId}/respond/`, {
                method: 'POST',
                body: JSON.stringify({ action }),
            });
            if (res.ok) {
                fetchGroups();
                fetchInvitations();
            }
        } catch (err) { console.error('Error:', err); }
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

    useEffect(() => {
        if (!isLoading && user) {
            fetchGroups();
            fetchInvitations();
        }
    }, [isLoading, user, fetchGroups, fetchInvitations]);

    useEffect(() => {
        if (!isLoading && !user) {
            window.location.href = '/login';
        }
    }, [isLoading, user]);

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

    const selectedGroup = groups.find(g => g.id === selectedGroupId);

    return (
        <div className="groups-page" ref={containerRef}>
            <SplineBackground />
            <BackgroundParticles />
            <div className="torch-overlay"></div>

            {/* Create Group Modal */}
            {showCreateGroup && (
                <CreateGroupModal
                    onClose={() => setShowCreateGroup(false)}
                    onGroupCreated={fetchGroups}
                />
            )}

            {selectedGroup && (
                <GroupDetailModal
                    group={selectedGroup as any}
                    currentUserId={user?.id || 0}
                    onClose={() => setSelectedGroupId(null)}
                    onUpdate={fetchGroups}
                />
            )}

            {/* Invite Modal */}
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
                            <div className="v-group-list" style={{ marginTop: 0 }}>
                                <input 
                                    type="text" 
                                    placeholder="Enter username" 
                                    value={inviteUsername}
                                    onChange={e => setInviteUsername(e.target.value)}
                                    autoFocus
                                    className="v-group-btn"
                                    style={{ background: 'rgba(0,0,0,0.3)', cursor: 'text' }}
                                />
                            </div>
                            {inviteError && <p className="v-error" style={{ marginBottom: '1rem' }}>{inviteError}</p>}
                            <button type="submit" disabled={inviteLoading} className="v-confirm-btn" style={{ background: '#8a2be2' }}>
                                {inviteLoading ? 'Sending...' : 'Send Invitation'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Exit Modal */}
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
                                <button 
                                    onClick={() => setShowExitModal(null)}
                                    className="v-group-btn"
                                    style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '16px' }}
                                >
                                    Go Back
                                </button>
                                <button 
                                    onClick={handleExitGroup}
                                    className="v-confirm-btn"
                                    style={{ flex: 1, marginTop: 0, background: '#ff3d00', borderRadius: '16px', boxShadow: '0 10px 20px rgba(255, 61, 0, 0.2)' }}
                                >
                                    Confirm Exit
                                </button>
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

            {/* Main Content */}
            <main className="gp-main">
                <div className="gp-header">
                    <h1>My Groups</h1>
                    <button className="gp-create-btn" onClick={() => setShowCreateGroup(true)}>+ Create Group</button>
                </div>

                {/* Pending Invitations */}
                {invitations.length > 0 && (
                    <section className="gp-invitations">
                        <h2>📩 Pending Invitations</h2>
                        <div className="gp-inv-list">
                            {invitations.map(inv => (
                                <div key={inv.id} className="gp-inv-card">
                                    <div className="gp-inv-info">
                                        <span className="gp-inv-name">{inv.group.name}</span>
                                        <span className="gp-inv-from">
                                            from <strong>@{inv.invited_by.username}</strong>
                                        </span>
                                    </div>
                                    <div className="gp-inv-actions">
                                        <button
                                            className="gp-inv-btn gp-inv-accept"
                                            disabled={respondingId === inv.id}
                                            onClick={() => handleRespond(inv.id, 'accept')}
                                        >
                                            ✓ Accept
                                        </button>
                                        <button
                                            className="gp-inv-btn gp-inv-decline"
                                            disabled={respondingId === inv.id}
                                            onClick={() => handleRespond(inv.id, 'decline')}
                                        >
                                            ✕ Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Groups List */}
                <section className="gp-groups">
                    <h2>Your Groups</h2>
                    {groups.length === 0 ? (
                        <div className="gp-empty">
                            <div className="gp-empty-icon">📂</div>
                            <p>No groups yet.</p>
                            <p className="gp-empty-sub">Create one or wait for an invitation!</p>
                        </div>
                    ) : (
                        <div className="gp-grid">
                            {groups.map(group => (
                                <div 
                                    key={group.id} 
                                    className="gp-card"
                                    onClick={() => setSelectedGroupId(group.id)}
                                    style={{ cursor: 'pointer', position: 'relative' }}
                                >
                                    <div className="gp-card-actions" onClick={e => e.stopPropagation()}>
                                        <button 
                                            className="gp-action-btn invite" 
                                            title="Add Member"
                                            onClick={() => setShowInviteModal(group.id)}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                        </button>
                                        <button 
                                            className="gp-action-btn exit" 
                                            title="Exit Group"
                                            onClick={() => setShowExitModal(group.id)}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                        </button>
                                    </div>
                                    <div className="gp-card-top">
                                        <h3>{group.name}</h3>
                                        {group.created_by && (
                                            <span className="gp-card-creator">by @{group.created_by.username}</span>
                                        )}
                                    </div>
                                    <p className="gp-card-count">
                                        {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                                    </p>
                                    <div className="gp-card-members">
                                        {group.members.map(m => (
                                            <span key={m.id} className="gp-member-chip">@{m.username}</span>
                                        ))}
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
