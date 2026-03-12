"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import './activities.css';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/api';
import BackgroundParticles from '@/components/BackgroundParticles';
import SplineBackground from '@/components/SplineBackground';

interface User {
    id: number;
    username: string;
}

interface Group {
    id: number;
    name: string;
    members: User[];
}

interface VoteData {
    id: number;
    voter: User;
    suspect: User;
    group: number;
}

export default function ActivitiesPage() {
    const { user, logout, isLoading } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const [showVoteModal, setShowVoteModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [groupVotes, setGroupVotes] = useState<VoteData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [warning, setWarning] = useState('');
    const [confirmSuspectId, setConfirmSuspectId] = useState<number | null>(null);

    const fetchGroups = useCallback(async () => {
        try {
            const res = await apiFetch('groups/');
            if (res.ok) setGroups(await res.json());
        } catch (err) { console.error('Failed to fetch groups:', err); }
    }, []);

    const fetchVotes = useCallback(async (groupId: number) => {
        try {
            const res = await apiFetch(`groups/${groupId}/votes/`);
            if (res.ok) setGroupVotes(await res.json());
        } catch (err) { console.error('Failed to fetch votes:', err); }
    }, []);

    useEffect(() => {
        if (!isLoading && user) {
            fetchGroups();
        }
    }, [isLoading, user, fetchGroups]);

    useEffect(() => {
        if (!isLoading && !user) {
            window.location.href = '/login';
        }
    }, [isLoading, user]);

    useEffect(() => {
        if (selectedGroup) fetchVotes(selectedGroup.id);
    }, [selectedGroup, fetchVotes]);

    const handleVote = async (suspectId: number, confirm: boolean = false) => {
        if (!selectedGroup) return;
        setLoading(true);
        setError('');
        setWarning('');
        
        try {
            const res = await apiFetch(`groups/${selectedGroup.id}/vote-member/${suspectId}/`, {
                method: 'POST',
                body: JSON.stringify({ confirm })
            });
            const data = await res.json();
            
            if (res.ok) {
                if (data.warning) {
                    setWarning(data.warning);
                    setConfirmSuspectId(suspectId);
                } else if (data.message) {
                    alert(data.message);
                    fetchGroups();
                    setSelectedGroup(null);
                    setShowVoteModal(false);
                } else {
                    fetchVotes(selectedGroup.id);
                    setConfirmSuspectId(null);
                }
            } else {
                setError(data.error || 'Failed to vote');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
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
                    borderTopColor: '#ff3d00',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="activities-container" ref={containerRef}>
            <SplineBackground />
            <BackgroundParticles />
            <div className="torch-overlay"></div>

            {/* Sidebar Trigger Area */}
            <div className="sidebar-trigger"></div>
            
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img src="/logo.jpg" alt="SplitPay" width="64" height="64" style={{ borderRadius: '12px' }} />
                    <span>SplitPay</span>
                </div>
                <nav className="nav-menu">
                    <a href="/dashboard" className="nav-item"><span>Dashboard</span></a>
                    <a href="/groups" className="nav-item"><span>My Groups</span></a>
                    <a href="/activities" className="nav-item active"><span>Activities</span></a>
                    <a href="/settlements" className="nav-item"><span>Settlements</span></a>
                    <a href="/settings" className="nav-item"><span>Settings</span></a>
                </nav>
                <div style={{ marginTop: 'auto' }}>
                    <button onClick={logout} className="nav-item logout-btn">
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="act-main">
                <div className="act-header">
                    <h1>Activities</h1>
                    <button className="vote-out-btn" onClick={() => setShowVoteModal(true)}>
                        Vote Out
                    </button>
                </div>

                <div className="act-content">
                    <div className="act-empty">
                        <div className="act-icon">📜</div>
                        <p>No recent activities to show.</p>
                        <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>Use the Vote Out button to remove inactive or problematic members.</p>
                    </div>
                </div>
            </main>

            {showVoteModal && (
                <div className="v-modal-overlay" onClick={() => { setShowVoteModal(false); setSelectedGroup(null); }}>
                    <div className="v-modal" onClick={e => e.stopPropagation()}>
                        <button className="v-close" onClick={() => { setShowVoteModal(false); setSelectedGroup(null); }}>&times;</button>
                        <h2>Vote Out Member</h2>
                        
                        {!selectedGroup ? (
                            <div className="v-group-list">
                                <p>Select a group:</p>
                                {groups.map(g => (
                                    <button key={g.id} className="v-group-btn" onClick={() => setSelectedGroup(g)}>
                                        {g.name}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="v-member-list">
                                <button className="v-back" onClick={() => setSelectedGroup(null)}>← Back to Groups</button>
                                <p>Members of <strong>{selectedGroup.name}</strong>:</p>
                                {selectedGroup.members.map(m => {
                                    if (m.id === user?.id) return null;
                                    const voteCount = groupVotes.filter(v => v.suspect.id === m.id).length;
                                    const hasIVoted = groupVotes.some(v => v.suspect.id === m.id && v.voter.id === user?.id);
                                    
                                    return (
                                        <div key={m.id} className="v-member-card">
                                            <div className="v-member-info">
                                                <span className="v-username">@{m.username}</span>
                                                <span className="v-count">{voteCount} / {selectedGroup.members.length - 1} votes</span>
                                            </div>
                                            {hasIVoted ? (
                                                <span className="v-status">Voted ✓</span>
                                            ) : (
                                                <button 
                                                    className="v-vote-btn" 
                                                    disabled={loading}
                                                    onClick={() => handleVote(m.id)}
                                                >
                                                    Vote
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {warning && (
                            <div className="v-warning-box">
                                <p>⚠️ {warning}</p>
                                <button className="v-confirm-btn" onClick={() => confirmSuspectId && handleVote(confirmSuspectId, true)}>
                                    I don&apos;t care, Vote anyway
                                </button>
                            </div>
                        )}
                        {error && <p className="v-error">{error}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
