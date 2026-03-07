"use client";

import React, { useState, useEffect, useCallback } from 'react';
import './GroupDetailModal.css';
import { apiFetch } from '@/utils/api';

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
    group_name: string;
}

interface Expense {
    id: number;
    description: string;
    amount: string;
    payer: User;
    created_at: string;
}

interface GroupDetailModalProps {
    group: Group;
    currentUserId: number;
    onClose: () => void;
    onUpdate: () => void;
}

export default function GroupDetailModal({ group, currentUserId, onClose, onUpdate }: GroupDetailModalProps) {
    const [loading, setLoading] = useState(false);
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [activeTab, setActiveTab] = useState<'pay' | 'balances' | 'history'>('pay');
    const [totalBill, setTotalBill] = useState('');
    const [nonVegCost, setNonVegCost] = useState('0');
    const [alcoholCost, setAlcoholCost] = useState('0');
    const [presentMemberIds, setPresentMemberIds] = useState<number[]>(group.members.map(m => m.id));
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const fetchSettlements = useCallback(async () => {
        try {
            const res = await apiFetch(`groups/${group.id}/settlements/`);
            if (res.ok) {
                const data = await res.json();
                setSettlements(data);
            }
        } catch (err) { console.error("Failed to fetch settlements", err); }
    }, [group.id]);

    const fetchExpenses = useCallback(async () => {
        try {
            const res = await apiFetch(`groups/${group.id}/expenses/`);
            if (res.ok) {
                const data = await res.json();
                setExpenses(data);
            }
        } catch (err) { console.error("Failed to fetch expenses", err); }
    }, [group.id]);

    useEffect(() => {
        fetchSettlements();
        fetchExpenses();
    }, [fetchSettlements, fetchExpenses]);

    const toggleMemberPresence = (userId: number) => {
        setPresentMemberIds(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId) 
                : [...prev, userId]
        );
    };

    const handleSplit = async () => {
        if (!totalBill || parseFloat(totalBill) <= 0) {
            setError("Please enter a valid total amount");
            return;
        }

        if (presentMemberIds.length === 0) {
            setError("At least one member must be present");
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMsg('');
        try {
            const res = await apiFetch(`groups/${group.id}/calculate-split/`, {
                method: 'POST',
                body: JSON.stringify({
                    total_amount: totalBill,
                    non_veg_amount: nonVegCost || '0',
                    alcohol_amount: alcoholCost || '0',
                    present_member_ids: presentMemberIds,
                    description: `Bill for ${group.name}`,
                    payer_id: currentUserId
                })
            });

            const data = await res.json();
            if (res.ok) {
                setSuccessMsg("Bill split successfully! Turn advanced.");
                setTotalBill('');
                setNonVegCost('0');
                setAlcoholCost('0');
                fetchSettlements();
                onUpdate(); // Refresh parent data
            } else {
                setError(data.error || data.detail || 'Failed to calculate split');
            }
        } catch (err) {
            setError('Network error: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // Live calculation for preview
    const calculatePreview = () => {
        const total = parseFloat(totalBill || '0');
        const nv = parseFloat(nonVegCost || '0');
        const alc = parseFloat(alcoholCost || '0');
        
        if (total <= 0 || presentMemberIds.length === 0) return null;
        
        const common = total - nv - alc;
        if (common < 0) return "Error: Specialty costs exceed total";
        
        const presentMembers = group.members.filter(m => presentMemberIds.includes(m.id));
        const commonShare = common / presentMembers.length;
        
        const nvPresent = presentMembers.filter(m => m.is_non_veg).length;
        const alcPresent = presentMembers.filter(m => m.is_drinker).length;
        
        const nvShare = nvPresent > 0 ? nv / nvPresent : 0;
        const alcShare = alcPresent > 0 ? alc / alcPresent : 0;

        return { commonShare, nvShare, alcShare, nvPresent, alcPresent };
    };

    const preview = calculatePreview();

    // Map member_order IDs to actual member objects for display
    const orderedMembers = group.member_order.map(id => 
        group.members.find(m => m.id === id)
    ).filter(Boolean) as User[];

    const currentPayerIndex = group.current_turn_index % (group.member_order.length || 1);
    
    // The active payer is the first person in the chain (starting from the turn index) who is PRESENT
    const getActivePayer = () => {
        for (let i = 0; i < orderedMembers.length; i++) {
            const idx = (currentPayerIndex + i) % orderedMembers.length;
            const candidate = orderedMembers[idx];
            if (presentMemberIds.includes(candidate.id)) return candidate;
        }
        return orderedMembers[currentPayerIndex]; // Fallback
    };

    const activePayer = getActivePayer();
    
    // The person who can take over is the next present person in the chain after the active payer
    const getNextAvailablePayer = () => {
        if (!activePayer) return null;
        const activeIdx = orderedMembers.findIndex(m => m.id === activePayer.id);
        if (activeIdx === -1) return null;
        
        for (let i = 1; i < orderedMembers.length; i++) {
            const idx = (activeIdx + i) % orderedMembers.length;
            const candidate = orderedMembers[idx];
            if (presentMemberIds.includes(candidate.id)) return candidate;
        }
        return null;
    };

    const nextAvailablePayer = getNextAvailablePayer();
    
    const isMyTurnToPay = activePayer?.id === currentUserId;
    const canITakeOver = nextAvailablePayer?.id === currentUserId;

    return (
        <div className="gdm-overlay">
            <div className="gdm-modal">
                <button className="gdm-close" onClick={onClose}>&times;</button>
                
                <header className="gdm-header">
                    <h2>{group.name}</h2>
                    <p>{group.description || 'No description provided.'}</p>
                </header>

                <div className="gdm-tabs">
                    <button className={`gdm-tab ${activeTab === 'pay' ? 'active' : ''}`} onClick={() => setActiveTab('pay')}>💸 Pay</button>
                    <button className={`gdm-tab ${activeTab === 'balances' ? 'active' : ''}`} onClick={() => setActiveTab('balances')}>📊 Balances</button>
                    <button className={`gdm-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>📜 History</button>
                </div>

                <div className="gdm-content">
                    {activeTab === 'pay' && (
                        <>
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

                            {isMyTurnToPay ? (
                                <section className="gdm-section gdm-bill-section">
                                    <h3>💸 Your Turn to Pay!</h3>
                                    
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

                                        <div className="gdm-presence-section">
                                            <label className="gdm-presence-label">Who was present?</label>
                                            <div className="gdm-member-checklist">
                                                {group.members.map(m => (
                                                    <label key={m.id} className="gdm-check-item">
                                                        <input 
                                                            type="checkbox"
                                                            checked={presentMemberIds.includes(m.id)}
                                                            onChange={() => toggleMemberPresence(m.id)}
                                                        />
                                                        <span className="gdm-check-name">@{m.username}</span>
                                                        <div className="gdm-check-prefs">
                                                            {m.is_non_veg && <span>🍗</span>}
                                                            {m.is_drinker && <span>🍺</span>}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {preview && typeof preview !== 'string' && (
                                            <div className="gdm-preview">
                                                <div className="gdm-preview-row">
                                                    <span>Common Share ({presentMemberIds.length} ppl):</span>
                                                    <strong>₹{preview.commonShare.toFixed(2)}</strong>
                                                </div>
                                                {preview.nvShare > 0 && (
                                                    <div className="gdm-preview-row">
                                                        <span>Non-Veg Share ({preview.nvPresent} present):</span>
                                                        <strong>₹{preview.nvShare.toFixed(2)}</strong>
                                                    </div>
                                                )}
                                                {preview.alcShare > 0 && (
                                                    <div className="gdm-preview-row">
                                                        <span>Alcohol Share ({preview.alcPresent} present):</span>
                                                        <strong>₹{preview.alcShare.toFixed(2)}</strong>
                                                    </div>
                                                )}
                                                <div className="gdm-preview-total">
                                                    <span>Veg Owe: ₹{preview.commonShare.toFixed(2)}</span>
                                                    <span>Non-Veg Owe: ₹{(preview.commonShare + preview.nvShare).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        )}
                                        {typeof preview === 'string' && <p className="gdm-preview-error">{preview}</p>}

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
                                    <p>Waiting for <strong>@{activePayer?.username}</strong> to pay.</p>
                                    {canITakeOver && (
                                        <div className="gdm-takeover-box">
                                            <p>Is <strong>@{activePayer?.username}</strong> absent?</p>
                                            <button 
                                                className="gdm-takeover-btn"
                                                onClick={() => {
                                                    setPresentMemberIds(prev => prev.filter(id => id !== activePayer.id));
                                                }}
                                            >
                                                🙋‍♂️ Yes, I will pay instead
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'balances' && (
                        <section className="gdm-section">
                            <h3>📊 Group Balances</h3>
                            {settlements.length === 0 ? (
                                <div className="gdm-waiting"><p>All settled up! 🌴</p></div>
                            ) : (
                                <div className="gdm-settlements">
                                    {settlements.map(s => (
                                        <div key={s.id} className="gdm-settlement-card">
                                            <div className="gdm-settlement-info">
                                                <span className={`gdm-s-user ${s.debtor.id === currentUserId ? 'is-me' : ''}`}>@{s.debtor.username}</span>
                                                <span className="gdm-s-arrow">owes</span>
                                                <span className={`gdm-s-user ${s.creditor.id === currentUserId ? 'is-me' : ''}`}>@{s.creditor.username}</span>
                                                <span className="gdm-s-amount">₹{parseFloat(s.amount).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {activeTab === 'history' && (
                        <section className="gdm-section">
                            <h3>📜 Expense History</h3>
                            {expenses.length === 0 ? (
                                <div className="gdm-waiting"><p>No expenses yet.</p></div>
                            ) : (
                                <div className="gdm-history-list">
                                    {expenses.map(exp => (
                                        <div key={exp.id} className="gdm-history-card">
                                            <div className="gdm-h-left">
                                                <span className="gdm-h-desc">{exp.description}</span>
                                                <span className="gdm-h-meta">Paid by @{exp.payer.username} • {new Date(exp.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <span className="gdm-h-amount">₹{parseFloat(exp.amount).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {successMsg && <p className="gdm-success">{successMsg}</p>}
                    {error && <p className="gdm-error">{error}</p>}
                </div>
            </div>
        </div>
    );
}
