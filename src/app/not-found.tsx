export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 font-sans cursor-default select-none p-4">
            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 10s linear infinite;
                }
            `}</style>

            <div className="text-center max-w-lg">
                {/* Animated Icon */}
                <div className="text-6xl mb-6 animate-spin-slow inline-block opacity-20">
                    ⚙️
                </div>

                <h1 className="text-4xl font-light mb-4 text-gray-900 tracking-tight">
                    Website Under Construction
                </h1>

                <div className="h-1 w-24 bg-yellow-400 mx-auto mb-6 rounded-full"></div>

                <p className="text-gray-500 mb-8 leading-relaxed">
                    We are currently working on something awesome.
                    Please check back soon for the launch of our new platform.
                </p>

                <div className="flex justify-center space-x-2">
                    <span className="h-2 w-2 bg-gray-300 rounded-full animate-pulse"></span>
                    <span className="h-2 w-2 bg-gray-300 rounded-full animate-pulse delay-100"></span>
                    <span className="h-2 w-2 bg-gray-300 rounded-full animate-pulse delay-200"></span>
                </div>

                <div className="text-xs text-gray-300 mt-16 font-mono uppercase tracking-widest">
                    &copy; 2026 ZeroKeep Inc.
                </div>
            </div>
        </div>
    );
}
