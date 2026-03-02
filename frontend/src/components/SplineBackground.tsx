"use client";

import Spline from '@splinetool/react-spline';
import { useRef } from 'react';

export default function SplineBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    const handleLoad = () => {
        // The Spline viewer renders its own <canvas> internally.
        // That canvas ignores the parent's pointer-events:none, so we
        // must set it directly on every canvas inside this container.
        if (containerRef.current) {
            const canvases = containerRef.current.querySelectorAll('canvas');
            canvases.forEach((c) => {
                c.style.pointerEvents = 'none';
            });
        }
    };

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
            }}
        >
            <Spline
                scene="https://prod.spline.design/ZnOZwrkhXMWIugqB/scene.splinecode"
                onLoad={handleLoad}
            />
        </div>
    );
}
