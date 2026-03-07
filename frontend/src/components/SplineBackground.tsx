"use client";

import React, { useRef, useState } from 'react';
import Spline from '@splinetool/react-spline';

export default function SplineBackground() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState(false);

    const handleLoad = () => {
        if (containerRef.current) {
            const canvases = containerRef.current.querySelectorAll('canvas');
            canvases.forEach((c) => {
                c.style.pointerEvents = 'none';
            });
        }
    };

    if (error) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                background: '#000'
            }} />
        );
    }

    return (
        <div
            ref={containerRef}
            className="spline-container"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                pointerEvents: 'none',
                background: '#000' // Fallback color
            }}
        >
            <Spline
                scene="https://prod.spline.design/ZnOZwrkhXMWIugqB/scene.splinecode"
                onLoad={handleLoad}
                onError={() => {
                    console.error("Spline failed to load");
                    setError(true);
                }}
            />
        </div>
    );
}
