"use client";

import React, { useState } from 'react';
import './GroupDetailModal.css';

interface User {
    id: number;
    username: string;
    is_non_veg: boolean;
    is_drinker: boolean;
}

interface Group {
    id: number;
    name: string;
    description: string;
    members: User[];
    member_order: number[];
    current_turn_index: number;
}

interface GroupDetailModalProps {
    group: Group;
    token: string;
    onClose: () => void;
    onUpdate: () => void;
}

export default function GroupDetailModal({ group, token, onClose, onUpdate }: GroupDetailModalProps) {
    const [loading, setLoading] = useState(false);
    const [nextPayer, setNextPayer] = useState<User | null>(null);
    const [error, setError] = useState('');

    const handleSplit = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`http://localhost:8001/api/groups/${group.id}/calculate-split/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await res.json();
            if (res.ok) {
                setNextPayer(data.payer);
                onUpdate(); // Refresh parent data
            } else {
                setError(data.error || 'Failed to calculate split');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    // Map member_order IDs to actual member objects for display
    const orderedMembers = group.member_order.map(id => 
        group.members.find(m => m.id === id)
    ).filter(Boolean) as User[];

    const currentPayerIndex = group.current_turn_index % (group.member_order.length || 1);

    return (
        <div className="gdm-overlay">
            <div className="gdm-modal">
                <button className="gdm-close" onClick={onClose}>&times;</button>
                
                <header className="gdm-header">
                    <h2>{group.name}</h2>
                    <p>{group.description || 'No description provided.'}</p>
                </header>

                <div className="gdm-content">
                    <section className="gdm-section">
                        <h3>⛓️ Payment Chain</h3>
                        <div className="gdm-chain">
                            {orderedMembers.map((member, idx) => (
                                <div key={member.id} className={`gdm-chain-item ${idx === currentPayerIndex ? 'active' : ''}`}>
                                    <span className="gdm-index">{idx + 1}</span>
                                    <span className="gdm-username">@{member.username}</span>
                                    {idx === currentPayerIndex && <span className="gdm-turn-badge">NEXT TURN</span>}
                                    <div className="gdm-prefs">
                                        {member.is_non_veg && <span title="Non-Veg">🍗</span>}
                                        {member.is_drinker && <span title="Drinker">🍺</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="gdm-actions">
                        <button 
                            className="gdm-split-btn" 
                            onClick={handleSplit}
                            disabled={loading || group.members.length === 0}
                        >
                            {loading ? 'Calculating...' : '🚀 SPLIT'}
                        </button>
                    </div>

                    {nextPayer && (
                        <div className="gdm-result">
                            <div className="gdm-result-icon">💸</div>
                            <h4>It's @{nextPayer.username}'s turn to pay!</h4>
                            <p>Turn advanced to next member in chain.</p>
                        </div>
                    )}

                    {error && <p className="gdm-error">{error}</p>}
                </div>
            </div>
        </div>
    );
}
