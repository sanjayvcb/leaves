import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

function Training() {
    const [leafName, setLeafName] = useState('')
    const [status, setStatus] = useState('idle')
    const [message, setMessage] = useState('')

    useEffect(() => {
        let interval;
        if (status !== 'idle' && status !== 'completed' && status !== 'error') {
            interval = setInterval(checkStatus, 2000);
        }
        return () => clearInterval(interval);
    }, [status]);

    const checkStatus = async () => {
        try {
            const res = await fetch(`${config.API_URL}/train/status`);
            const data = await res.json();
            setStatus(data.status);
            setMessage(data.message);
        } catch (error) {
            console.error("Polling error", error);
        }
    }

    const handleStartTraining = async () => {
        try {
            const res = await fetch(`${config.API_URL}/train/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leaf_name: leafName })
            });
            if (res.ok) {
                setStatus('starting');
                setMessage('Starting process...');
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (error) {
            alert("Failed to start training");
        }
    }

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

                {!status || status === 'idle' || status === 'completed' || status === 'error' ? (
                    <div className="space-y-6">
                        {status === 'completed' && (
                            <div className="bg-green-100/50 border border-green-200 text-green-800 p-4 rounded-xl text-center mb-6">
                                <p className="font-bold">Training Successful!</p>
                                <p className="text-sm">The model has been updated with the new data.</p>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="bg-red-100/50 border border-red-200 text-red-800 p-4 rounded-xl text-center mb-6">
                                <p className="font-bold">Error</p>
                                <p className="text-sm">{message}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-slate-500 text-sm font-bold mb-2" htmlFor="leaf">
                                Leaf Name
                            </label>
                            <input
                                id="leaf"
                                type="text"
                                value={leafName}
                                onChange={(e) => setLeafName(e.target.value)}
                                placeholder="e.g. Mango"
                                className="shadow-sm appearance-none border border-slate-200 rounded-xl w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-white"
                            />
                            <p className="text-xs text-slate-400 mt-2 ml-1">
                                We will automatically download 50+ images and train the model.
                            </p>
                        </div>

                        <button
                            onClick={handleStartTraining}
                            disabled={!leafName.trim()}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Start Training
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="relative w-24 h-24 mx-auto mb-6">
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <h2 className="text-xl font-bold text-slate-700 mb-2 capitalize">
                            {status === 'starting' ? 'Initializing...' : status}
                        </h2>
                        <p className="text-slate-500 max-w-xs mx-auto animate-pulse">
                            {message}
                        </p>

                        <div className="mt-8 flex justify-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${['downloading', 'preparing', 'training', 'finalizing'].includes(status) ? 'bg-blue-500' : 'bg-slate-200'}`}></span>
                            <span className={`h-2 w-2 rounded-full ${['preparing', 'training', 'finalizing'].includes(status) ? 'bg-blue-500' : 'bg-slate-200'}`}></span>
                            <span className={`h-2 w-2 rounded-full ${['training', 'finalizing'].includes(status) ? 'bg-blue-500' : 'bg-slate-200'}`}></span>
                            <span className={`h-2 w-2 rounded-full ${['finalizing'].includes(status) ? 'bg-blue-500' : 'bg-slate-200'}`}></span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Training

