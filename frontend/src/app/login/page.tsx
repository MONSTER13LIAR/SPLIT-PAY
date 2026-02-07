"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './login.css';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(false);
    const [username, setUsername] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isLogin) {
                // Login Logic
                const response = await fetch('http://localhost:8000/api/token/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('token', data.access);
                    router.push('/dashboard');
                } else {
                    setError('Invalid username or password');
                }
            } else {
                // Registration Logic
                if (username.length < 3) {
                    setError('Username must be at least 3 characters');
                    setIsLoading(false);
                    return;
                }

                const response = await fetch('http://localhost:8000/api/register/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, phone_number: phoneNumber, password }),
                });

                if (response.ok) {
                    // Auto-login after registration
                    const loginResponse = await fetch('http://localhost:8000/api/token/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password }),
                    });
                    const loginData = await loginResponse.json();

                    if (loginResponse.ok) {
                        localStorage.setItem('token', loginData.access);
                        router.push('/dashboard');
                    } else {
                        setIsLogin(true);
                        setError('Registration successful! Please sign in.');
                    }
                } else {
                    const data = await response.json();
                    setError(data.error || 'Registration failed');
                }
            }
        } catch (err) {
            setError('Connection error. Is the backend running?');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="background-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>

            <div className="login-card">
                <div className="login-header">
                    <h1 className="logo-text">SPLIT<span>PAY</span></h1>
                    <p className="subtitle">
                        {isLogin ? 'Welcome back!' : 'Manage expenses, minus the stress.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div className="input-group">
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                type="tel"
                                id="phone"
                                placeholder="Enter your phone number"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            placeholder={isLogin ? "Enter password" : "Strong password required"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {!isLogin && <small className="hint">Must include uppercase, lowercase, digit, and special char.</small>}
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? <span className="loader"></span> : (isLogin ? 'Sign In' : 'Sign Up & Get Started')}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            className="text-button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
