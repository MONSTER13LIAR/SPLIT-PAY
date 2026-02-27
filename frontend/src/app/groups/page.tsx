"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import './groups.css';
import { useAuth } from '@/context/AuthContext';
import BackgroundParticles from '@/components/BackgroundParticles';
import SplineBackground from '@/components/SplineBackground';
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

export default function GroupsPage() {
    const { user, logout, token } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [invitations, setInvitations] = useState<InvitationData[]>([]);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [respondingId, setRespondingId] = useState<number | null>(null);

    const fetchGroups = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:8001/api/groups/', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) setGroups(await res.json());
        } catch (err) { console.error('Failed to fetch groups:', err); }
    }, [token]);

    const fetchInvitations = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:8001/api/invitations/', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) setInvitations(await res.json());
        } catch (err) { console.error('Failed to fetch invitations:', err); }
    }, [token]);

    useEffect(() => {
        fetchGroups();
        fetchInvitations();
    }, [fetchGroups, fetchInvitations]);

    const handleRespond = async (invId: number, action: 'accept' | 'decline') => {
        if (!token) return;
        setRespondingId(invId);
        try {
            const res = await fetch(`http://localhost:8001/api/invitations/${invId}/respond/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ action }),
            });
            if (res.ok) {
                fetchGroups();
                fetchInvitations();
            }
        } catch (err) { console.error('Error:', err); }
        setRespondingId(null);
    };

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

    return (
        <div className="groups-page" ref={containerRef}>
            <SplineBackground />
            <BackgroundParticles />
            <div className="torch-overlay"></div>

            {showCreateGroup && token && (
                <CreateGroupModal
                    token={token}
                    onClose={() => setShowCreateGroup(false)}
                    onGroupCreated={() => fetchGroups()}
                />
            )}

            {/* Sidebar Trigger */}
            <div className="sidebar-trigger"></div>
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img src="/logo.jpg" alt="SplitPay" width="64" height="64" style={{ borderRadius: '12px' }} />
                    <span style={{ fontWeight: 800, fontSize: '2rem', letterSpacing: '-1px' }}>SplitPay</span>
                </div>
                <nav className="nav-menu">
                    <a href="/dashboard" className="nav-item"><span>Dashboard</span></a>
                    <a href="/groups" className="nav-item active"><span>My Groups</span></a>
                    <a href="#" className="nav-item"><span>Activities</span></a>
                    <a href="#" className="nav-item"><span>Settlements</span></a>
                    <a href="#" className="nav-item"><span>Settings</span></a>
                </nav>
                <div style={{ marginTop: 'auto' }}>
                    <button onClick={logout} className="nav-item" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

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
                                <div key={group.id} className="gp-card">
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
