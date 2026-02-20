"use client";

import Spline from '@splinetool/react-spline';

export default function SplineBackground() {
    return (
        <div className="spline-container" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -1,
            pointerEvents: 'none',
        }}>
            <Spline
                scene="https://prod.spline.design/ZnOZwrkhXMWIugqB/scene.splinecode"
            />
        </div>
    );
}
