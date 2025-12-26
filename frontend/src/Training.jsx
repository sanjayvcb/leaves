import { Link } from 'react-router-dom'

function Training() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/40 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-200/40 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="z-10 w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl shadow-slate-200/50 p-8 transition-all hover:bg-white/80">
                <div className="flex items-center mb-8">
                    <Link to="/" className="mr-4 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                        Train Model
                    </h1>
                </div>

                <div className="text-center text-slate-500 py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <p className="mb-4">Training functionality coming soon...</p>
                    {/* Placeholder for future training form/upload */}
                </div>
            </div>
        </div>
    )
}

export default Training
