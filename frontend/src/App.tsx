import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { extractVideoId, safeFilename } from './lib';

type TranscriptItem = {
  id: number;
  start: number;
  duration: number;
  timestamp: string;
  text: string;
};

type TranscriptData = {
  success: true;
  videoId: string;
  videoUrl: string;
  language: string;
  languageCode: string;
  isGenerated: boolean;
  itemCount: number;
  transcript: TranscriptItem[];
  fullText: string;
  formattedText: string;
  srtText: string;
};

type HistoryItem = {
  videoId: string;
  language: string;
  itemCount: number;
  savedAt: string;
  data: TranscriptData;
};

type ApiError = { error?: string };

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const HISTORY_KEY = 'youtube-transcript-extractor-history-v1';

function Icon({ name }: { name: 'youtube' | 'search' | 'copy' | 'download' | 'clock' | 'spark' }) {
  const paths = {
    youtube: <path d="M21.2 7.2a2.4 2.4 0 0 0-1.7-1.7C18 5.1 12 5.1 12 5.1s-6 0-7.5.4a2.4 2.4 0 0 0-1.7 1.7A25 25 0 0 0 2.4 12a25 25 0 0 0 .4 4.8 2.4 2.4 0 0 0 1.7 1.7c1.5.4 7.5.4 7.5.4s6 0 7.5-.4a2.4 2.4 0 0 0 1.7-1.7 25 25 0 0 0 .4-4.8 25 25 0 0 0-.4-4.8ZM10 15.2V8.8l5.3 3.2-5.3 3.2Z" />,
    search: <><circle cx="11" cy="11" r="6" /><path d="m20 20-4.6-4.6" /></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M5 20h14" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    spark: <path d="m12 2 1.5 5.2L19 9l-5.5 1.8L12 16l-1.5-5.2L5 9l5.5-1.8L12 2Zm6 13 .8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z" />,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={`icon icon-${name}`}>{paths[name]}</svg>;
}

function loadHistory(): HistoryItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    return [];
  }
}

function downloadText(content: string, filename: string, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [tab, setTab] = useState<'extractor' | 'history'>('extractor');
  const [url, setUrl] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<TranscriptData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [selectedTime, setSelectedTime] = useState(0);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/api/health`, { signal: controller.signal })
      .then((response) => setApiOnline(response.ok))
      .catch(() => setApiOnline(false));
    return () => controller.abort();
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return data?.transcript ?? [];
    return (data?.transcript ?? []).filter(
      (item) => item.text.toLocaleLowerCase().includes(needle) || item.timestamp.includes(needle),
    );
  }, [data, query]);

  function persist(item: TranscriptData) {
    const entry: HistoryItem = {
      videoId: item.videoId,
      language: item.language,
      itemCount: item.itemCount,
      savedAt: new Date().toISOString(),
      data: item,
    };
    const next = [entry, ...history.filter((saved) => saved.videoId !== item.videoId)].slice(0, 10);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      setError('Transcript loaded, but browser storage is full. Export it before leaving this page.');
    }
  }

  async function extract(event: FormEvent) {
    event.preventDefault();
    setError('');
    setQuery('');
    const videoId = extractVideoId(url);
    if (!videoId) {
      setError('Enter a valid YouTube link or 11-character video ID.');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => ({}))) as TranscriptData | ApiError;
      if (!response.ok || !('success' in payload) || payload.success !== true) {
        throw new Error('error' in payload && payload.error ? payload.error : 'The transcript request failed.');
      }
      setData(payload);
      setSelectedTime(0);
      setApiOnline(true);
      persist(payload);
    } catch (reason) {
      const message = reason instanceof DOMException && reason.name === 'AbortError'
        ? 'The request timed out. Check the API and try again.'
        : reason instanceof Error ? reason.message : 'The transcript request failed.';
      setError(message);
      setApiOnline(false);
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(''), 1_800);
    } catch {
      setError('Clipboard access was blocked. Download the transcript instead.');
    }
  }

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Transcript Studio home">
          <span className="brand-mark"><Icon name="youtube" /></span>
          <span>Transcript <b>Studio</b></span>
        </a>
        <nav aria-label="Primary navigation" className="nav-tabs">
          <button className={tab === 'extractor' ? 'active' : ''} onClick={() => setTab('extractor')}>Extractor</button>
          <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
            History <span>{history.length}</span>
          </button>
        </nav>
      </header>

      <main id="top">
        {tab === 'extractor' ? (
          <>
            <section className="hero" aria-labelledby="hero-title">
              <div className="eyebrow"><Icon name="spark" /> Captions, cleaned and ready</div>
              <h1 id="hero-title">Turn a YouTube video into <em>useful text.</em></h1>
              <p>Search every line, jump to the moment, and export clean text or production-ready subtitles.</p>

              <form className="extract-form" onSubmit={extract}>
                <label className="url-field">
                  <span className="sr-only">YouTube URL or video ID</span>
                  <Icon name="search" />
                  <input
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="Paste a YouTube URL or video ID"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={2048}
                  />
                </label>
                <button className="primary-button" type="submit" disabled={loading || !url.trim()}>
                  {loading ? <><span className="spinner" /> Extracting</> : 'Get transcript'}
                </button>
              </form>

              <div className="status-row" aria-live="polite">
                <span className={`status-dot ${apiOnline === false ? 'offline' : ''}`} />
                {apiOnline === null ? 'Checking API' : apiOnline ? 'API ready' : 'API unavailable'}
                <span className="status-divider" />
                No YouTube account or API key required
              </div>
              {error && <div className="alert" role="alert">{error}</div>}
            </section>

            {data ? (
              <section className="workspace" aria-label="Transcript results">
                <aside className="video-column">
                  <div className="video-card">
                    <div className="video-frame">
                      <iframe
                        key={`${data.videoId}-${selectedTime}`}
                        src={`https://www.youtube-nocookie.com/embed/${data.videoId}?start=${selectedTime}`}
                        title="Selected YouTube video"
                        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <div className="video-meta">
                      <div><span>Language</span><strong>{data.language}</strong></div>
                      <div><span>Captions</span><strong>{data.itemCount.toLocaleString()}</strong></div>
                      <div><span>Track</span><strong>{data.isGenerated ? 'Auto-generated' : 'Creator supplied'}</strong></div>
                    </div>
                    <a href={data.videoUrl} target="_blank" rel="noopener noreferrer" className="watch-link">Open on YouTube ↗</a>
                  </div>

                  <div className="export-card">
                    <div className="card-heading"><span>Export transcript</span><small>UTF-8</small></div>
                    <button onClick={() => copy(data.fullText, 'plain')}><Icon name="copy" /> {copied === 'plain' ? 'Copied' : 'Copy plain text'}</button>
                    <button onClick={() => copy(data.formattedText, 'time')}><Icon name="copy" /> {copied === 'time' ? 'Copied' : 'Copy with timestamps'}</button>
                    <div className="export-grid">
                      <button onClick={() => downloadText(data.fullText, safeFilename(data.videoId, 'txt'))}><Icon name="download" /> TXT</button>
                      <button onClick={() => downloadText(data.srtText, safeFilename(data.videoId, 'srt'))}><Icon name="download" /> SRT</button>
                    </div>
                  </div>
                </aside>

                <div className="transcript-card">
                  <div className="transcript-header">
                    <div>
                      <span className="section-label">Interactive transcript</span>
                      <h2>Read along</h2>
                    </div>
                    <label className="transcript-search">
                      <span className="sr-only">Search transcript</span>
                      <Icon name="search" />
                      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search words or time" />
                    </label>
                  </div>
                  <div className="result-count" aria-live="polite">{filtered.length} of {data.itemCount} lines</div>
                  <div className="transcript-list">
                    {filtered.length ? filtered.map((item) => (
                      <button className="transcript-line" key={item.id} onClick={() => setSelectedTime(Math.floor(item.start))}>
                        <span className="timestamp"><Icon name="clock" />{item.timestamp}</span>
                        <span>{item.text}</span>
                      </button>
                    )) : <div className="empty-state">No transcript lines match “{query}”.</div>}
                  </div>
                </div>
              </section>
            ) : (
              <section className="feature-strip" aria-label="Features">
                <div><b>01</b><span><strong>Extract</strong>Available public captions</span></div>
                <div><b>02</b><span><strong>Navigate</strong>Click any timestamp</span></div>
                <div><b>03</b><span><strong>Export</strong>TXT and SRT formats</span></div>
              </section>
            )}
          </>
        ) : (
          <section className="history-page">
            <div className="history-heading">
              <div><span className="section-label">Stored on this device</span><h1>Recent transcripts</h1></div>
              {history.length > 0 && <button className="danger-button" onClick={clearHistory}>Clear history</button>}
            </div>
            <p className="privacy-note">Transcript content stays in this browser’s local storage. It is never uploaded anywhere except the configured transcript API.</p>
            {history.length ? (
              <div className="history-grid">
                {history.map((item) => (
                  <article key={item.videoId} className="history-card">
                    <div className="history-thumb"><Icon name="youtube" /></div>
                    <span className="history-id">{item.videoId}</span>
                    <h2>{item.language} transcript</h2>
                    <p>{item.itemCount.toLocaleString()} captions · {new Date(item.savedAt).toLocaleString()}</p>
                    <button onClick={() => { setData(item.data); setUrl(item.data.videoUrl); setTab('extractor'); }}>Open transcript</button>
                  </article>
                ))}
              </div>
            ) : <div className="empty-history"><Icon name="clock" /><h2>No saved transcripts yet</h2><p>Your ten most recent extractions will appear here.</p></div>}
          </section>
        )}
      </main>

      <footer><span>Transcript Studio</span><span>Public captions only · Respect creators and YouTube’s terms</span></footer>
    </div>
  );
}

export default App;
