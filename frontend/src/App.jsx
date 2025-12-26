import { useState, useRef } from 'react'

function App() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
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

  const triggerCamera = () => {
    fileInputRef.current.click()
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-green-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8 transition-all hover:bg-white/15">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
          Leaf Classifier
        </h1>

        <div className="relative group w-full aspect-square bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center mb-8 overflow-hidden hover:border-emerald-500 transition-colors">
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No image selected</p>
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
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Capture / Upload
          </button>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`flex-1 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${!file || loading
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30 active:scale-95'
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

        {/* Results Section */}
        {result && (
          <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-6 animate-fade-in-up">
            <h2 className="text-xl font-semibold text-emerald-300 mb-2">Analysis Result</h2>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-emerald-100/70 uppercase tracking-widest">Species</p>
                <p className="text-3xl font-bold text-white capitalize">{result.class}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-emerald-100/70 uppercase tracking-widest">Confidence</p>
                <p className="text-2xl font-bold text-emerald-300">{(result.confidence * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-emerald-500/30">
              <p className="text-xs text-emerald-200/50">
                Also detected probabilities:
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(result.all_probs)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 4)
                  .map(([name, conf]) => (
                    <div key={name} className="flex justify-between text-xs text-emerald-100/80">
                      <span className="capitalize">{name}</span>
                      <span>{(conf * 100).toFixed(1)}%</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 text-slate-500 text-xs text-center">
        Powered by YOLOv8n and Flask
      </div>
    </div>
  )
}

export default App
