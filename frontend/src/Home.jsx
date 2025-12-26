import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function Home() {
    const navigate = useNavigate()
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [imageUrl, setImageUrl] = useState('')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef(null)

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile) {
            setFile(selectedFile)
            setImageUrl('') // clear url if file is selected
            setPreview(URL.createObjectURL(selectedFile))
            setResult(null)
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setLoading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch('http://localhost:5000/predict', {
                method: 'POST',
                body: formData,
            })
            const data = await response.json()
            if (response.ok) {
                setResult(data)
            } else {
                alert('Error: ' + data.error)
            }
        } catch (error) {
            console.error('Error uploading file:', error)
            alert('Failed to connect to the server.')
        } finally {
            setLoading(false)
        }
    }

    const handleUrlUpload = async () => {
        if (!imageUrl) return

        setLoading(true)
        try {
            // Optimistic preview update if simple image url
            // setPreview(imageUrl) 

            const response = await fetch('http://localhost:5000/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: imageUrl }),
            })
            const data = await response.json()
            if (response.ok) {
                setResult(data)
            } else {
                alert('Error: ' + data.error)
            }
        } catch (error) {
            console.error('Error processing URL:', error)
            alert('Failed to connect to the server.')
        } finally {
            setLoading(false)
        }
    }

    const triggerCamera = () => {
        fileInputRef.current.click()
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-green-200/40 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-200/40 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="z-10 w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl shadow-slate-200/50 p-8 transition-all hover:bg-white/80">
                <h1 className="text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                    Leaf Classifier
                </h1>

                <div className="relative group w-full aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center mb-8 overflow-hidden hover:border-emerald-500 hover:bg-slate-50/80 transition-all duration-300">
                    {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                        <div className="text-center text-slate-400 group-hover:text-emerald-500/70 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="font-medium">Tap to Upload Image</p>
                        </div>
                    )}

                    <input
                        type="file"
                        accept="image/*"
                        capture="environment" // Hints mobile to use camera
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                    />
                </div>

                <div className="flex gap-4 mb-8">
                    <button
                        onClick={triggerCamera}
                        className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                        Capture
                    </button>

                    <button
                        onClick={handleUpload}
                        disabled={!file || loading}
                        className={`flex-1 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${!file || loading
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 active:scale-95'
                            }`}
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            'Identify Leaf'
                        )}
                    </button>
                </div>

                <div className="relative flex py-2 items-center mb-6">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Or via URL</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div className="flex gap-2 mb-8">
                    <input
                        type="text"
                        placeholder="Paste image URL here..."
                        value={imageUrl}
                        onChange={(e) => {
                            setImageUrl(e.target.value)
                            setFile(null) // clear file if url is used
                            if (e.target.value) setPreview(e.target.value)
                        }}
                        className="flex-1 shadow-sm appearance-none border border-slate-200 rounded-xl py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all bg-white"
                    />
                    <button
                        onClick={handleUrlUpload}
                        disabled={!imageUrl || loading}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
                    >
                        Go
                    </button>
                </div>

                {/* Results Section */}
                {result && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 animate-fade-in-up">
                        <h2 className="text-sm font-bold text-emerald-600 mb-4 uppercase tracking-wider">Analysis Result</h2>
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Species</p>
                                <p className="text-2xl font-black text-slate-800 capitalize leading-none">{result.class}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Confidence</p>
                                <p className="text-2xl font-black text-emerald-600 leading-none">{(result.confidence * 100).toFixed(1)}%</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-emerald-100">
                            <p className="text-xs text-slate-400 mb-2 font-medium">
                                Other Possibilities:
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(result.all_probs)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 4)
                                    .map(([name, conf]) => (
                                        <div key={name} className="flex justify-between items-center text-xs p-2 bg-white/50 rounded-lg">
                                            <span className="capitalize text-slate-700 font-medium">{name}</span>
                                            <span className="text-slate-500">{(conf * 100).toFixed(1)}%</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <button
                        onClick={() => navigate('/train')}
                        className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        Train with new data
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Home
