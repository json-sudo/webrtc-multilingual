import { useState, useRef } from 'react';
import './styles/app.css';
// import { MicButton } from './components/MicButton';
import { createRecorder } from './lib/recorder';
import { connectSocket } from './lib/caption-socket';
import { CaptionsPanel } from './components/CaptionsPanel';
import { Metrics } from './lib/metrics';
import { MetricsCard } from './components/MetricsCard';

function App() {
    const [active, setActive] = useState(false);
    const [stats, setStats] = useState({ e2e: {p50:0,p90:0,n:0}, server:{p50:0,p90:0,n:0}, render:{p50:0,p90:0,n:0} });

    const [chunkCount, setChunkCount] = useState(0);
    const [wsStatus, setWsStatus] = useState<'closed'|'open'|'error'|'connecting'>('connecting');


    const metrics = useRef(new Metrics());
    const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);
    const feedRef = useRef<(m: any) => void>(() => {});

    const videoRef = useRef<HTMLVideoElement>(null);
    const trackRef = useRef<TextTrack | null>(null);
    const vttOffsetRef = useRef<number | null>(null);

    async function start() {
        if (active) return;

        const recorder = await createRecorder(400);
        const stream = await recorder.start(({ index, startSec, endSec }) => {
            setChunkCount(c => c + 1);
            socketRef.current?.sendChunk(index, startSec, endSec);
        });

        // Drive the <video> clock with the mic stream
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        const trackEl = document.getElementById('capt') as HTMLTrackElement;
        trackRef.current = trackEl.track;

        // socket
        const sock = connectSocket();
        sock.ws.addEventListener('open', () => setWsStatus('open'));
        sock.ws.addEventListener('close', () => setWsStatus('closed'));
        sock.ws.addEventListener('error', () => setWsStatus('error'));
        socketRef.current = sock;

        sock.onCaption((m) => {
            // --- Metrics: E2E & server compute ---
            const tRecv = performance.now();
            const e2e = tRecv - (m.t0 ?? tRecv);
            metrics.current.pushE2E(e2e);
            const srvCompute = (m.asr_ms ?? 0) + (m.mt_ms ?? 0);
            metrics.current.pushSrv(srvCompute);

            // --- Feed the panel (keeps partials/finals visible) ---
            feedRef.current(m);

            // --- WebVTT: add/replace cue mapped to <video> time ---
            const tr = trackRef.current!;
            const cueId = `c${m.index}`;
            if (vttOffsetRef.current == null) {
                // anchor offset on first caption
                vttOffsetRef.current = video.currentTime - m.start;
            }
            const offset = vttOffsetRef.current;
            const start = offset + m.start;
            const end   = offset + Math.max(m.end, m.start + 0.6);

            // Find existing cue by id
            let cue: VTTCue | null = null;
            const cues = tr.cues;
            if (cues) {
                for (let i = 0; i < cues.length; i++) {
                    const c = cues[i] as VTTCue;
                    if (c.id === cueId) { cue = c; break; }
                }
            }

            const renderStart = performance.now();
            if (cue) {
                // update
                cue.startTime = start;
                cue.endTime = end;
                cue.text = m.text;
            } else {
                cue = new VTTCue(start, end, m.text);
                cue.id = cueId;
                tr.addCue(cue);
            }
            const renderMs = performance.now() - renderStart;
            metrics.current.pushRender(renderMs);

            // Periodically refresh the visible stats
            if ((metrics.current.e2e.length % 5) === 0) {
                setStats(metrics.current.snapshot());
            }
        });

        (window as any).__recorder = recorder;
        setActive(true);
    }

    function stop() {
        socketRef.current?.ws.close();
        (window as any).__recorder?.stop?.();
        const video = videoRef.current!;
        if (video) {
            if (video.srcObject) (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            video.srcObject = null;
        }
        vttOffsetRef.current = null;
        setActive(false);
    }

    return (
        <div className="mx-auto max-w-3xl p-6">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold">WebRTC Live Captioner — Prototype</h1>
                <p className="text-sm text-gray-600">Mic → chunks → WS → partial/final captions.</p>
                <p className="text-xs text-gray-600">
                    WS: {wsStatus} • chunks: {chunkCount}
                </p>
            </header>

            <div className="flex items-center gap-3">
                {!active ? (
                    <button className="rounded-xl bg-sky-600 px-4 py-2 text-white ring-1 ring-sky-700 hover:bg-sky-700"
                            onClick={start} data-testid="start-all">Start</button>
                ) : (
                    <button className="rounded-xl bg-red-600 px-4 py-2 text-white ring-1 ring-red-700 hover:bg-red-700"
                            onClick={stop} data-testid="stop-all">Stop</button>
                )}
            </div>

            {/* Live captions panel */}
            <CaptionsPanel feed={feedRef} />

            {/* Media element + captions track (driven by mic stream) */}
            <video ref={videoRef} className="mt-4 w-full rounded-xl bg-black/5" autoPlay playsInline muted>
                <track id="capt" kind="captions" srcLang="en" default />
            </video>

            {/* Metrics */}
            <MetricsCard stats={stats} />
        </div>
    );
}

export default App;
