"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import './dashboard.css';
import { useAuth } from '@/context/AuthContext';
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

export default function Dashboard() {
    const { user, logout, token, updateUser } = useAuth();
    const dashboardRef = useRef<HTMLDivElement>(null);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [invitations, setInvitations] = useState<InvitationData[]>([]);
    const [respondingId, setRespondingId] = useState<number | null>(null);

    const fetchGroups = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:8001/api/groups/', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setGroups(data);
            }
        } catch (err) {
            console.error('Failed to fetch groups:', err);
        }
    }, [token]);

    const fetchInvitations = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:8001/api/invitations/', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setInvitations(data);
            }
        } catch (err) {
            console.error('Failed to fetch invitations:', err);
        }
    }, [token]);

    useEffect(() => {
        fetchGroups();
        fetchInvitations();
    }, [fetchGroups, fetchInvitations]);

    const handleRespondInvitation = async (invitationId: number, action: 'accept' | 'decline') => {
        if (!token) return;
        setRespondingId(invitationId);
        try {
            const res = await fetch(`http://localhost:8001/api/invitations/${invitationId}/respond/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ action }),
            });
            if (res.ok) {
                // Refresh both groups and invitations
                fetchGroups();
                fetchInvitations();
            }
        } catch (err) {
            console.error('Failed to respond to invitation:', err);
        }
        setRespondingId(null);
    };

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

    return (
        <div className="dashboard-container" ref={dashboardRef}>
            <SplineBackground />
            <BackgroundParticles />
            <div className="torch-overlay"></div>

            {/* Username Setup Modal */}
            {user && !user.has_set_username && token && (
                <SetUsernameModal
                    token={token}
                    onUsernameSet={(updatedUser) => updateUser(updatedUser)}
                />
            )}

            {/* Create Group Modal */}
            {showCreateGroup && token && (
                <CreateGroupModal
                    token={token}
                    onClose={() => setShowCreateGroup(false)}
                    onGroupCreated={() => { fetchGroups(); }}
                />
            )}

            {/* Sidebar Trigger Area */}
            <div className="sidebar-trigger"></div>
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img src="/logo.jpg" alt="SplitPay" width="64" height="64" style={{ borderRadius: '12px' }} />
                    <span style={{ fontWeight: 800, fontSize: '2rem', letterSpacing: '-1px' }}>SplitPay</span>
                </div>

                <nav className="nav-menu">
                    <a href="/dashboard" className="nav-item active">
                        <span>Dashboard</span>
                    </a>
                    <a href="/groups" className="nav-item">
                        <span>My Groups</span>
                    </a>
                    <a href="#" className="nav-item">
                        <span>Activities</span>
                    </a>
                    <a href="#" className="nav-item">
                        <span>Settlements</span>
                    </a>
                    <a href="#" className="nav-item">
                        <span>Settings</span>
                    </a>
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <button
                        onClick={logout}
                        className="nav-item"
                        style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="dashboard-header">
                    <div className="welcome-text">
                        <h1>Welcome back, {user?.username || user?.first_name || 'Friend'}! 👋</h1>
                        <p>Here&apos;s what&apos;s happening with your expenses.</p>
                    </div>
                </header>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Total Outstanding</div>
                        <div className="stat-value">₹0.00</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">You are owed</div>
                        <div className="stat-value" style={{ color: '#00e676' }}>₹0.00</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">You owe</div>
                        <div className="stat-value" style={{ color: '#ff3d00' }}>₹0.00</div>
                    </div>
                </div>

                {/* Pending Invitations */}
                {invitations.length > 0 && (
                    <section className="invitations-section">
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', marginBottom: '1.25rem' }}>
                            Pending Invitations
                        </h2>
                        <div className="invitations-list">
                            {invitations.map(inv => (
                                <div key={inv.id} className="invitation-card">
                                    <div className="invitation-info">
                                        <span className="invitation-group-name">{inv.group.name}</span>
                                        <span className="invitation-from">
                                            invited by <strong>@{inv.invited_by.username}</strong>
                                        </span>
                                    </div>
                                    <div className="invitation-actions">
                                        <button
                                            className="inv-btn inv-accept"
                                            disabled={respondingId === inv.id}
                                            onClick={() => handleRespondInvitation(inv.id, 'accept')}
                                        >
                                            Accept
                                        </button>
                                        <button
                                            className="inv-btn inv-decline"
                                            disabled={respondingId === inv.id}
                                            onClick={() => handleRespondInvitation(inv.id, 'decline')}
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Groups Section */}
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
                                <div key={group.id} className="group-card">
                                    <h3 className="group-card-name">{group.name}</h3>
                                    <p className="group-card-members">
                                        {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                                    </p>
                                    <div className="group-card-avatars">
                                        {group.members.slice(0, 5).map(m => (
                                            <span key={m.id} className="group-avatar" title={m.username}>
                                                {m.username[0].toUpperCase()}
                                            </span>
                                        ))}
                                        {group.members.length > 5 && (
                                            <span className="group-avatar group-avatar-more">
                                                +{group.members.length - 5}
                                            </span>
                                        )}
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
