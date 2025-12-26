import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import config from './config'

function Training() {
    const [leafName, setLeafName] = useState('')
    const [status, setStatus] = useState('idle')
    const [message, setMessage] = useState('')
    const [previewImages, setPreviewImages] = useState([])
    const [showPreview, setShowPreview] = useState(false)
    const [loadingPreview, setLoadingPreview] = useState(false)
    const [trainedLabels, setTrainedLabels] = useState([])
    const [selectedFiles, setSelectedFiles] = useState([])
    const [uploadingFiles, setUploadingFiles] = useState(false)
    const [imageCount, setImageCount] = useState(30)

    useEffect(() => {
        // Fetch trained labels on mount
        fetchTrainedLabels();
    }, []);

    useEffect(() => {
        let interval;
        if (status !== 'idle' && status !== 'completed' && status !== 'error') {
            interval = setInterval(checkStatus, 2000);
        }
        return () => clearInterval(interval);
    }, [status]);

    const fetchTrainedLabels = async () => {
        try {
            const res = await fetch(`${config.API_URL}/train/labels`);
            const data = await res.json();
            setTrainedLabels(data.labels || []);
        } catch (error) {
            console.error("Failed to fetch trained labels", error);
        }
    }

    const checkStatus = async () => {
        try {
            const res = await fetch(`${config.API_URL}/train/status`);
            const data = await res.json();
            setStatus(data.status);
            setMessage(data.message);
            
            // Reset preview state when training completes
            if (data.status === 'completed') {
                setShowPreview(false);
                setPreviewImages([]);
                // Refresh trained labels list
                fetchTrainedLabels();
            }
        } catch (error) {
            console.error("Polling error", error);
        }
    }

    const handlePreview = async () => {
        setLoadingPreview(true);
        try {
            const res = await fetch(`${config.API_URL}/train/preview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    leaf_name: leafName,
                    max_images: imageCount
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                setPreviewImages(data.images);
                setShowPreview(true);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to fetch preview images');
            }
        } catch (error) {
            alert("Failed to load preview images");
        } finally {
            setLoadingPreview(false);
        }
    }

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
    }

    const handleUpload = async () => {
        if (!leafName.trim()) {
            alert('Please enter a leaf name first');
            return;
        }
        if (selectedFiles.length === 0) {
            alert('Please select images to upload');
            return;
        }

        setUploadingFiles(true);
        try {
            const formData = new FormData();
            formData.append('leaf_name', leafName);
            selectedFiles.forEach(file => {
                formData.append('images', file);
            });

            const res = await fetch(`${config.API_URL}/train/upload`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setPreviewImages(data.images);
                setShowPreview(true);
                setSelectedFiles([]);
                alert(`Successfully uploaded ${data.count} images!`);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to upload images');
            }
        } catch (error) {
            alert("Failed to upload images");
        } finally {
            setUploadingFiles(false);
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
                setShowPreview(false);
            } else {
                const data = await res.json();
                if (data.already_trained) {
                    alert(`⚠️ ${data.error}\n\nPlease choose a different leaf name that hasn't been trained yet.`);
                } else {
                    alert(data.error);
                }
            }
        } catch (error) {
            alert("Failed to start training");
        }
    }

    const handleDeleteLabel = async (label) => {
        if (!window.confirm(`Are you sure you want to delete '${label}'? This will remove all training data for this leaf.`)) {
            return;
        }

        try {
            const res = await fetch(`${config.API_URL}/train/labels/${label}`, {
                method: 'DELETE',
            });
            
            if (res.ok) {
                // Refresh list
                fetchTrainedLabels();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete label');
            }
        } catch (error) {
            console.error("Delete error", error);
            alert("Failed to delete label");
        }
    }

    const handleCancel = () => {
        setShowPreview(false);
        setPreviewImages([]);
    }

    const handleReset = () => {
        setStatus('idle');
        setMessage('');
        setLeafName('');
        setShowPreview(false);
        setPreviewImages([]);
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/40 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-200/40 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="z-10 w-full max-w-4xl bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl shadow-slate-200/50 p-8 transition-all hover:bg-white/80">
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

                {/* Preview Mode */}
                {showPreview ? (
                    <div className="space-y-6">
                        <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4">
                            <h2 className="text-lg font-bold text-blue-900 mb-2">Preview: {leafName}</h2>
                            <p className="text-sm text-blue-700">Found {previewImages.length} images. Review them below and confirm to start training.</p>
                        </div>

                        {/* Image Gallery */}
                        <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto p-2 bg-slate-50/50 rounded-xl">
                            {previewImages.map((imgUrl, idx) => (
                                <div key={idx} className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-200">
                                    <img 
                                        src={`${config.API_URL}${imgUrl}`} 
                                        alt={`Preview ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={handleCancel}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStartTraining}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                            >
                                Confirm & Start Training
                            </button>
                        </div>
                    </div>
                ) : !status || status === 'idle' || status === 'completed' || status === 'error' ? (
                    <div className="space-y-6">
                        {status === 'completed' && (
                            <div className="space-y-6">
                                <div className="bg-green-100/50 border border-green-200 text-green-800 p-6 rounded-xl text-center">
                                    <div className="mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="font-bold text-xl mb-2">Training Successful!</p>
                                    <p className="text-sm">The model has been updated with the new data.</p>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                                >
                                    Train Another Leaf
                                </button>
                            </div>
                        )}

                        {status === 'error' && (
                            <>
                                <div className="bg-red-100/50 border border-red-200 text-red-800 p-4 rounded-xl text-center mb-6">
                                    <p className="font-bold">Error</p>
                                    <p className="text-sm">{message}</p>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-xl transition-all active:scale-95"
                                >
                                    Try Again
                                </button>
                            </>
                        )}

                        {(!status || status === 'idle') && (
                            <>
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
                                        required
                                        className="shadow-sm appearance-none border border-slate-200 rounded-xl w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-white"
                                    />
                                    <p className="text-xs text-slate-400 mt-2 ml-1">
                                        We will download sample images for you to review before training.
                                    </p>
                                    
                                    <div className="mt-4">
                                        <label className="block text-slate-500 text-sm font-bold mb-2" htmlFor="count">
                                            Number of Images
                                        </label>
                                        <input
                                            id="count"
                                            type="number"
                                            min="10"
                                            max="100"
                                            value={imageCount}
                                            onChange={(e) => setImageCount(parseInt(e.target.value) || 20)}
                                            className="shadow-sm appearance-none border border-slate-200 rounded-xl w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-white"
                                        />
                                        <p className="text-xs text-slate-400 mt-1 ml-1">
                                            More images = better accuracy, but longer download time. (Rec: 20-50)
                                        </p>
                                    </div>
                                    {trainedLabels.length > 0 && (
                                        <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                                            <p className="text-xs font-semibold text-blue-700 mb-2">Already Trained:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {trainedLabels.map((label, idx) => (
                                                    <div key={idx} className="flex items-center bg-blue-100 text-blue-700 text-xs rounded-md pl-2 pr-1 py-1 capitalize border border-blue-200">
                                                        <span>{label}</span>
                                                        <button 
                                                            onClick={() => handleDeleteLabel(label)}
                                                            className="ml-1 p-0.5 hover:bg-blue-200 rounded-full text-blue-500 hover:text-red-500 transition-colors"
                                                            title="Delete this class"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handlePreview}
                                    disabled={!leafName.trim() || loadingPreview}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loadingPreview ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Searching...
                                        </>
                                    ) : (
                                        'Search'
                                    )}
                                </button>

                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <p className="text-xs text-slate-500 mb-3 text-center">Or upload your own images</p>
                                    
                                    <label className="block w-full cursor-pointer">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <div className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 transition-all text-center">
                                            {selectedFiles.length > 0 ? (
                                                <span>📁 {selectedFiles.length} file(s) selected</span>
                                            ) : (
                                                <span>📤 Choose Images</span>
                                            )}
                                        </div>
                                    </label>

                                    {selectedFiles.length > 0 && (
                                        <button
                                            onClick={handleUpload}
                                            disabled={uploadingFiles}
                                            className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-green-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {uploadingFiles ? (
                                                <>
                                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Uploading...
                                                </>
                                            ) : (
                                                '✓ Upload & Preview'
                                            )}
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
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
