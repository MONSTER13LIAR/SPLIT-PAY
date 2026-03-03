"use client";

import React, { useState, useEffect, useCallback } from 'react';
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

interface Settlement {
    id: number;
    debtor: User;
    creditor: User;
    amount: string;
}

interface GroupDetailModalProps {
    group: Group;
    token: string;
    currentUserId: number;
    onClose: () => void;
    onUpdate: () => void;
}

export default function GroupDetailModal({ group, token, currentUserId, onClose, onUpdate }: GroupDetailModalProps) {
    const [loading, setLoading] = useState(false);
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [totalBill, setTotalBill] = useState('');
    const [nonVegCost, setNonVegCost] = useState('0');
    const [alcoholCost, setAlcoholCost] = useState('0');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const fetchSettlements = useCallback(async () => {
        try {
            const res = await fetch(`http://localhost:8001/api/groups/${group.id}/settlements/`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSettlements(data);
            }
        } catch (err) { console.error("Failed to fetch settlements", err); }
    }, [group.id, token]);

    useEffect(() => {
        fetchSettlements();
    }, [fetchSettlements]);

    const handleSplit = async () => {
        if (!totalBill || parseFloat(totalBill) <= 0) {
            setError("Please enter a valid total amount");
            return;
        }

        if (!token) {
            setError("Authentication token missing. Please log in again.");
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMsg('');
        try {
            const res = await fetch(`http://localhost:8001/api/groups/${group.id}/calculate-split/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    total_amount: totalBill,
                    non_veg_amount: nonVegCost || '0',
                    alcohol_amount: alcoholCost || '0',
                    description: `Bill for ${group.name}`
                })
            });

            const data = await res.json();
            if (res.ok) {
                setSuccessMsg("Bill split successfully! Turn advanced.");
                setTotalBill('');
                setNonVegCost('0');
                setAlcoholCost('0');
                fetchSettlements();
                onUpdate(); // Refresh parent data (group turn index)
            } else {
                setError(data.error || data.detail || 'Failed to calculate split');
            }
        } catch (err) {
            setError('Network error: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // Map member_order IDs to actual member objects for display
    const orderedMembers = group.member_order.map(id => 
        group.members.find(m => m.id === id)
    ).filter(Boolean) as User[];

    const currentPayerIndex = group.current_turn_index % (group.member_order.length || 1);
    const currentPayer = orderedMembers[currentPayerIndex];
    const isMyTurn = currentPayer?.id === currentUserId;

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
                                    {idx === currentPayerIndex && <span className="gdm-turn-badge">PAYER</span>}
                                    <div className="gdm-prefs">
                                        {member.is_non_veg && <span title="Non-Veg">🍗</span>}
                                        {member.is_drinker && <span title="Drinker">🍺</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {isMyTurn ? (
                        <section className="gdm-section gdm-bill-section">
                            <h3>💸 Your Turn to Pay!</h3>
                            <p className="gdm-instruction">Enter the bill details below to split with the group.</p>
                            
                            <div className="gdm-bill-form">
                                <div className="gdm-input-group">
                                    <label>Total Bill Amount (₹)</label>
                                    <input 
                                        type="number" 
                                        placeholder="0.00"
                                        value={totalBill}
                                        onChange={(e) => setTotalBill(e.target.value)}
                                    />
                                </div>
                                <div className="gdm-input-group">
                                    <label>Non-Veg Cost (₹)</label>
                                    <input 
                                        type="number" 
                                        placeholder="0.00"
                                        value={nonVegCost}
                                        onChange={(e) => setNonVegCost(e.target.value)}
                                    />
                                </div>
                                <div className="gdm-input-group">
                                    <label>Alcohol Cost (₹)</label>
                                    <input 
                                        type="number" 
                                        placeholder="0.00"
                                        value={alcoholCost}
                                        onChange={(e) => setAlcoholCost(e.target.value)}
                                    />
                                </div>
                                <button 
                                    className="gdm-split-btn" 
                                    onClick={handleSplit}
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : '🚀 Split Bill & Finish Turn'}
                                </button>
                            </div>
                        </section>
                    ) : (
                        <div className="gdm-waiting">
                            <p>Waiting for <strong>@{currentPayer?.username}</strong> to pay and split the bill.</p>
                        </div>
                    )}

                    {settlements.length > 0 && (
                        <section className="gdm-section">
                            <h3>📊 Current Balances</h3>
                            <div className="gdm-settlements">
                                {settlements.map(s => (
                                    <div key={s.id} className="gdm-settlement-card">
                                        <span className={`gdm-s-user ${s.debtor.id === currentUserId ? 'is-me' : ''}`}>@{s.debtor.username}</span>
                                        <span className="gdm-s-arrow">owes</span>
                                        <span className={`gdm-s-user ${s.creditor.id === currentUserId ? 'is-me' : ''}`}>@{s.creditor.username}</span>
                                        <span className="gdm-s-amount">₹{parseFloat(s.amount).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {successMsg && <p className="gdm-success">{successMsg}</p>}
                    {error && <p className="gdm-error">{error}</p>}
                </div>
            </div>
        </div>
    );
}
