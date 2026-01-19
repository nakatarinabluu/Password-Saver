"use client";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800 font-sans cursor-default select-none p-4">

            <div className="text-center max-w-lg">
                {/* Primary Animation: SPINNING Gear */}
                <div className="text-8xl mb-6 inline-block opacity-40 animate-spin" style={{ animationDuration: '3s' }}>
                    ⚙️
                </div>

                <h1 className="text-4xl font-light mb-4 text-gray-900 tracking-tight">
                    Under Maintenance
                </h1>

                {/* Secondary Animation: PULSING Bar */}
                <div className="h-2 w-48 bg-gray-300 rounded-full mx-auto mb-8 overflow-hidden">
                    <div className="h-full bg-blue-500 w-1/2 rounded-full animate-pulse"></div>
                </div>

                <p className="text-gray-500 mb-12 leading-relaxed">
                    Our site is currently undergoing scheduled upgrades.
                    <br />
                    We should be back shortly. Thank you for your patience.
                </p>

                <div className="flex justify-center items-center space-x-4">
                    {/* Bouncing Dots */}
                    <div className="h-3 w-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="h-3 w-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="h-3 w-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>

                <div className="text-xs text-gray-400 mt-20 font-mono uppercase tracking-widest">
                    &copy; 2026 ZeroKeep Inc.
                </div>
            </div>
        </div>
    );
}
