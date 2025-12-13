import React from 'react';

const GridBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Subtle Grid Pattern */}
            <div
                className="absolute inset-0 z-0 opacity-[0.15]"
                style={{
                    backgroundImage: `linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    maskImage: 'radial-gradient(circle at center, black 0%, transparent 80%)',
                    WebkitMaskImage: 'radial-gradient(circle at center, black 0%, transparent 80%)'
                }}
            ></div>

            {/* Secondary finer grid for detail */}
            <div
                className="absolute inset-0 z-0 opacity-[0.08]"
                style={{
                    backgroundImage: `linear-gradient(#818cf8 0.5px, transparent 0.5px), linear-gradient(90deg, #818cf8 0.5px, transparent 0.5px)`,
                    backgroundSize: '10px 10px',
                    maskImage: 'radial-gradient(circle at center, black 0%, transparent 60%)',
                    WebkitMaskImage: 'radial-gradient(circle at center, black 0%, transparent 60%)'
                }}
            ></div>
        </div>
    );
};

export default GridBackground;
