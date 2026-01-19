export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-red-500 font-mono">
            <div className="text-center border border-red-900 p-8 bg-gray-900 shadow-[0_0_20px_rgba(255,0,0,0.2)]">
                <h1 className="text-6xl font-bold mb-4">404</h1>
                <h2 className="text-xl mb-4 tracking-widest uppercase">Signal Lost</h2>
                <p className="text-gray-500 text-sm">The requested resource could not be located on this server.</p>
                <div className="mt-8">
                    <a href="/" className="px-4 py-2 border border-red-700 hover:bg-red-900 transition-colors text-xs uppercase tracking-widest">
                        Return to Base
                    </a>
                </div>
            </div>
        </div>
    );
}
