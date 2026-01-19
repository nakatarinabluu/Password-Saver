"use client";

export default function NotFound() {
    return (
        // Main Background: App Theme #04326E
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#04326E] text-white font-sans cursor-default select-none p-4">

            <div className="text-center max-w-lg">
                {/* Animated Gear */}
                <div className="text-8xl mb-6 inline-block opacity-20 animate-spin" style={{ animationDuration: '3s' }}>
                    ⚙️
                </div>

                <h1 className="text-4xl font-light mb-4 text-blue-100 tracking-tight">
                    System Maintenance
                </h1>

                {/* Pulsing Bar */}
                <div className="h-2 w-48 bg-blue-900 rounded-full mx-auto mb-8 overflow-hidden">
                    <div className="h-full bg-blue-400 w-1/2 rounded-full animate-pulse"></div>
                </div>

                <p className="text-blue-200 mb-12 leading-relaxed">
                    The ZeroKeep secure environment is updating.
                    <br />
                    Access is temporarily restricted.
                </p>

                <div className="flex justify-center items-center space-x-4">
                    {/* Dots */}
                    <div className="h-3 w-3 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="h-3 w-3 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="h-3 w-3 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>

                <div className="text-xs text-blue-400/50 mt-20 font-mono uppercase tracking-widest">
                    &copy; 2026 ZeroKeep Inc.
                </div>
            </div>
        </div>
    );
}
