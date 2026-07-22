import React, { useState, useEffect, useRef } from 'react';

// Custom inline SVG icons for zero external dependency runtime stability
const Icons = {
  Youtube: () => (
    <svg className="w-6 h-6 text-red-500 fill-current" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  Search: () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    </svg>
  ),
  Copy: () => (
    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
    </svg>
  ),
  Download: () => (
    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4 mr-1.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
    </svg>
  ),
  History: () => (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  Github: () => (
    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  ),
  ExternalLink: () => (
    <svg className="w-4 h-4 ml-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
    </svg>
  )
};

const App = () => {
  const [urlInput, setUrlInput] = useState('');
  const [backendUrl, setBackendUrl] = useState('http://localhost:5000');
  const [activeTab, setActiveTab] = useState('extractor'); // extractor | history | github
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transcriptData, setTranscriptData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedFormat, setCopiedFormat] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedTimestamp, setSelectedTimestamp] = useState(0);
  const [useDemoFallback, setUseDemoFallback] = useState(true);

  // Load history from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('yt_transcript_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load search history');
    }
  }, []);

  const extractVideoId = (url) => {
    if (!url) return null;
    const cleanUrl = url.trim();
    if (cleanUrl.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
      return cleanUrl;
    }
    const match = cleanUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const generateDemoTranscript = (videoId) => {
    const demoItems = [
      { id: 1, start: 0.5, duration: 4.2, timestamp: '00:00', text: "Welcome to this deep dive tutorial on building modern web applications." },
      { id: 2, start: 5.1, duration: 5.8, timestamp: '00:05', text: "In today's project, we are creating a complete full-stack YouTube Transcript Extractor." },
      { id: 3, start: 11.2, duration: 6.4, timestamp: '00:11', text: "We will connect a React frontend with a Python Flask backend that extracts closed captions." },
      { id: 4, start: 18.0, duration: 5.1, timestamp: '00:18', text: "You can search through timestamps, jump to specific parts of the video, and export to TXT or SRT." },
      { id: 5, start: 23.5, duration: 7.0, timestamp: '00:23', text: "This project can be pushed directly to your personal GitHub repository for showcasing on your portfolio!" },
      { id: 6, start: 31.0, duration: 6.2, timestamp: '00:31', text: "Make sure to check out the GitHub Guide tab at the top for step-by-step instructions on setting up your repository." },
      { id: 7, start: 38.0, duration: 4.5, timestamp: '00:38', text: "Thank you for watching, and let's start extracting transcripts effortlessly!" }
    ];

    return {
      success: true,
      videoId: videoId || 'dQw4w9WgXcQ',
      videoUrl: `https://www.youtube.com/watch?v=${videoId || 'dQw4w9WgXcQ'}`,
      language: 'English (Demo)',
      isGenerated: false,
      isDemoMode: true,
      itemCount: demoItems.length,
      transcript: demoItems,
      fullText: demoItems.map(i => i.text).join(' '),
      formattedText: demoItems.map(i => `[${i.timestamp}] ${i.text}`).join('\n')
    };
  };

  const handleExtract = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setSearchQuery('');
    
    const videoId = extractVideoId(urlInput);
    if (!videoId) {
      setError('Please enter a valid YouTube video URL or 11-character video ID.');
      return;
    }

    setIsLoading(true);

    try {
      // Attempt live call to Python Flask backend
      const response = await fetch(`${backendUrl}/api/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transcript from backend server.');
      }

      const data = await response.json();
      setTranscriptData(data);
      saveToHistory(data);

    } catch (err) {
      console.warn('Backend fetch failed, checking demo fallback:', err.message);
      
      if (useDemoFallback) {
        // Fallback to client-side demo preview if backend is not currently running
        const demoData = generateDemoTranscript(videoId);
        setTranscriptData(demoData);
        saveToHistory(demoData);
        setError(`Note: Could not connect to Flask API at ${backendUrl}. Showing simulated preview. Start your Python backend to get live captions!`);
      } else {
        setError(`Backend Error: ${err.message}. Ensure app.py is running on ${backendUrl}.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveToHistory = (item) => {
    setHistory((prev) => {
      const exists = prev.some((h) => h.videoId === item.videoId);
      const updated = [
        {
          videoId: item.videoId,
          title: `YouTube Video (${item.videoId})`,
          itemCount: item.itemCount,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          data: item
        },
        ...prev.filter((h) => h.videoId !== item.videoId)
      ].slice(0, 15); // Keep last 15 searches
      
      try {
        localStorage.setItem('yt_transcript_history', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save to localStorage');
      }
      return updated;
    });
  };

  const copyToClipboard = (text, formatName) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  const downloadFile = (content, filename, contentType) => {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Filter transcript lines based on user search query
  const filteredTranscript = transcriptData?.transcript?.filter((item) =>
    item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.timestamp.includes(searchQuery)
  ) || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl">
              <Icons.Youtube />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight">YT Transcript</span>
              <span className="text-xs bg-red-500/20 text-red-400 font-semibold px-2 py-0.5 rounded-full ml-2 border border-red-500/30">
                PRO
              </span>
            </div>
          </div>

          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('extractor')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'extractor'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Extractor
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icons.History />
              History ({history.length})
            </button>
            <button
              onClick={() => setActiveTab('github')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center ${
                activeTab === 'github'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icons.Github />
              GitHub Guide
            </button>
          </nav>
        </div>
      </header>

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'extractor' && (
          <div className="space-y-8">
            {/* URL Input Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <h2 className="text-2xl font-bold text-white mb-2">Extract YouTube Captions</h2>
              <p className="text-slate-400 text-sm mb-6">
                Paste any YouTube video URL or ID to pull timestamps and clean text transcriptions instantly.
              </p>

              <form onSubmit={handleExtract} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Icons.Search />
                  </div>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !urlInput.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25 flex items-center justify-center shrink-0"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Extracting...
                    </span>
                  ) : (
                    'Get Transcript'
                  )}
                </button>
              </form>

              {/* Status & Options settings */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Flask API: <code className="text-slate-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{backendUrl}</code></span>
                </div>
                <label className="flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useDemoFallback}
                    onChange={(e) => setUseDemoFallback(e.target.checked)}
                    className="mr-1.5 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                  />
                  Enable Demo Preview fallback if local API is offline
                </label>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl flex items-start space-x-2">
                  <span className="text-amber-400 font-bold shrink-0">⚠️</span>
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Results Grid View */}
            {transcriptData && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Video Preview & Metadata */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center justify-between">
                      <span>Video Player</span>
                      {transcriptData.isDemoMode && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">Demo Mode</span>
                      )}
                    </h3>
                    <div className="aspect-video w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                      <iframe
                        src={`https://www.youtube.com/embed/${transcriptData.videoId}?start=${selectedTimestamp}&autoplay=1`}
                        title="YouTube Video Player"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <div className="mt-4 text-xs text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Language:</span>
                        <span className="text-slate-200 font-medium">{transcriptData.language || 'English'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transcript Lines:</span>
                        <span className="text-slate-200 font-medium">{transcriptData.itemCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Source URL:</span>
                        <a
                          href={transcriptData.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline flex items-center"
                        >
                          Watch on YT <Icons.ExternalLink />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Export Actions Panel */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Export & Copy Options</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => copyToClipboard(transcriptData.fullText, 'plain')}
                        className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition flex items-center justify-between"
                      >
                        <span className="flex items-center">
                          {copiedFormat === 'plain' ? <Icons.Check /> : <Icons.Copy />}
                          Copy Plain Text
                        </span>
                        <span className="text-[10px] text-slate-500">No Timestamps</span>
                      </button>

                      <button
                        onClick={() => copyToClipboard(transcriptData.formattedText, 'timestamped')}
                        className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition flex items-center justify-between"
                      >
                        <span className="flex items-center">
                          {copiedFormat === 'timestamped' ? <Icons.Check /> : <Icons.Copy />}
                          Copy with Timestamps
                        </span>
                        <span className="text-[10px] text-slate-500">[00:00] format</span>
                      </button>

                      <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => downloadFile(transcriptData.fullText, `transcript_${transcriptData.videoId}.txt`, 'text/plain')}
                          className="py-2 px-3 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-300 text-xs font-medium rounded-xl transition flex items-center justify-center"
                        >
                          <Icons.Download /> .TXT File
                        </button>
                        <button
                          onClick={() => downloadFile(transcriptData.srtText || transcriptData.formattedText, `subtitles_${transcriptData.videoId}.srt`, 'text/plain')}
                          className="py-2 px-3 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-purple-300 text-xs font-medium rounded-xl transition flex items-center justify-center"
                        >
                          <Icons.Download /> .SRT File
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Interactive Transcript View */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col h-[600px]">
                  {/* Search bar inside transcript */}
                  <div className="mb-4 flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
                    <div className="relative w-full sm:w-72">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icons.Search />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search transcript keyword..."
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <span className="text-xs text-slate-400 self-end sm:self-center">
                      Showing {filteredTranscript.length} of {transcriptData.itemCount} entries
                    </span>
                  </div>

                  {/* Scrollable Transcript Box */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {filteredTranscript.length > 0 ? (
                      filteredTranscript.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedTimestamp(Math.floor(item.start))}
                          className="group p-3 rounded-xl bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/50 hover:border-blue-500/40 cursor-pointer transition flex items-start space-x-3"
                        >
                          <button
                            title="Click to jump to video timestamp"
                            className="font-mono text-xs font-semibold px-2 py-1 rounded bg-blue-500/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition shrink-0"
                          >
                            {item.timestamp}
                          </button>
                          <p className="text-xs sm:text-sm text-slate-300 group-hover:text-white leading-relaxed pt-0.5">
                            {item.text}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                        No lines found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Extraction History</h2>
                <p className="text-xs text-slate-400">Previous transcripts saved in browser cache</p>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem('yt_transcript_history');
                  }}
                  className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition"
                >
                  Clear History
                </button>
              )}
            </div>

            {history.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span>{h.date} at {h.time}</span>
                        <span className="font-mono text-blue-400">{h.videoId}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white line-clamp-1 mb-2">{h.title}</h4>
                      <p className="text-xs text-slate-400 mb-4">{h.itemCount} captions extracted</p>
                    </div>
                    <button
                      onClick={() => {
                        setTranscriptData(h.data);
                        setUrlInput(h.data.videoUrl);
                        setActiveTab('extractor');
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition"
                    >
                      Open Transcript
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-sm">
                No history entries found yet. Extract a transcript to get started!
              </div>
            )}
          </div>
        )}

        {/* GitHub Repository Setup Guide */}
        {activeTab === 'github' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Icons.Github /> GitHub Project Deployment Guide
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Follow these exact steps to create a repository on GitHub and run your backend and frontend.
              </p>
            </div>

            <div className="space-y-6 text-sm text-slate-300">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h3 className="font-semibold text-white text-base">Step 1: Initialize Git Repository</h3>
                <p className="text-xs text-slate-400">Open your terminal inside your project folder and run:</p>
                <pre className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto">
                  git init{"\n"}
                  git add .{"\n"}
                  git commit -m "Initial commit: YouTube Transcript Extractor"
                </pre>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h3 className="font-semibold text-white text-base">Step 2: Create GitHub Repo & Push</h3>
                <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1">
                  <li>Go to <strong>github.com/new</strong> and create a public repository named <code className="text-blue-400">youtube-transcript-extractor</code>.</li>
                  <li>Link your local folder and push your code:</li>
                </ol>
                <pre className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto">
                  git remote add origin https://github.com/YOUR_USERNAME/youtube-transcript-extractor.git{"\n"}
                  git branch -M main{"\n"}
                  git push -u origin main
                </pre>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h3 className="font-semibold text-white text-base">Step 3: Run Python Flask Backend Locally</h3>
                <pre className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto">
                  cd backend{"\n"}
                  pip install flask flask-cors youtube-transcript-api{"\n"}
                  python app.py
                </pre>
                <p className="text-xs text-slate-400">Your backend will be running at <code className="text-blue-400">http://localhost:5000</code>.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;