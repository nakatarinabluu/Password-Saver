"use client";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 font-sans cursor-default select-none p-4 overflow-hidden relative">
            <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes stripe-move {
          0% { background-position: 0 0; }
          100% { background-position: 50px 50px; }
        }
        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }
        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: gray }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .construction-stripes {
          background-image: linear-gradient(
            -45deg, 
            rgba(255, 255, 255, .2) 25%, 
            transparent 25%, 
            transparent 50%, 
            rgba(255, 255, 255, .2) 50%, 
            rgba(255, 255, 255, .2) 75%, 
            transparent 75%, 
            transparent
          );
          background-size: 50px 50px;
          animation: stripe-move 2s linear infinite;
        }
        .typewriter h1 {
          overflow: hidden;
          border-right: .15em solid gray;
          white-space: nowrap;
          margin: 0 auto;
          letter-spacing: .15em;
          animation: 
            typing 3s steps(40, end),
            blink-caret .75s step-end infinite;
        }
      `}</style>

            {/* Background Stripes at Top and Bottom */}
            <div className="absolute top-0 left-0 w-full h-4 bg-yellow-400 construction-stripes opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-full h-4 bg-yellow-400 construction-stripes opacity-50"></div>

            <div className="text-center max-w-2xl px-6 relative z-10">
                {/* Animated Icons Ecosystem */}
                <div className="relative inline-block mb-12">
                    <div className="text-8xl animate-spin-slow opacity-20 filter grayscale">⚙️</div>
                    <div className="absolute top-0 right-0 text-4xl animate-spin-slow opacity-20 filter grayscale" style={{ animationDirection: 'reverse', animationDuration: '8s', top: '-10px', right: '-20px' }}>⚙️</div>
                    <div className="absolute bottom-0 left-0 text-4xl animate-spin-slow opacity-20 filter grayscale" style={{ animationDirection: 'reverse', animationDuration: '15s', bottom: '-10px', left: '-20px' }}>⚙️</div>
                </div>

                <div className="typewriter mb-8">
                    <h1 className="text-3xl md:text-5xl font-extralight text-gray-900 tracking-tight">
                        SYSTEM UPGRADE IN PROGRESS
                    </h1>
                </div>

                <div className="h-1.5 w-32 bg-yellow-400 mx-auto mb-8 rounded-full shadow-sm"></div>

                <p className="text-gray-500 mb-8 text-lg font-light leading-relaxed max-w-prose mx-auto">
                    We are performing scheduled maintenance to improve your experience.
                    <br />
                    Our engineers are hard at work. Expected completion: <span className="font-semibold">Soon</span>.
                </p>

                {/* Fake Loading Bar */}
                <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full bg-blue-500 w-2/3 rounded-full opacity-50 animate-pulse"></div>
                </div>

                <div className="text-xs text-gray-300 mt-20 font-mono uppercase tracking-[0.2em] hover:text-gray-400 transition-colors">
                    Est. 2026 • ZeroKeep Inc.
                </div>
            </div>
        </div>
    );
}
