import { useState, useRef } from 'react';
import './styles/app.css';
import { createRecorder } from './lib/recorder';
import { connectSocket } from './lib/caption-socket';
import { CaptionsPanel } from './components/CaptionsPanel';

function App() {
    const [active, setActive] = useState(false);
    const [currentCaption, setCurrentCaption] = useState<string>('');

    const [chunkCount, setChunkCount] = useState(0);
    const [wsStatus, setWsStatus] = useState<'closed'|'open'|'error'|'connecting'>('connecting');


    // const metrics = useRef(new Metrics());
    const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);
    const offRef = useRef<(() => void) | null>(null);
    const feedRef = useRef<(m: any) => void>(() => {});

    const videoRef = useRef<HTMLVideoElement>(null);
    const trackRef = useRef<TextTrack | null>(null);
    const vttOffsetRef = useRef<number | null>(null);
    const cueMap = useRef<Map<number, VTTCue>>(new Map());

    async function start() {
        if (active) return;

       const sock = connectSocket();
       socketRef.current = sock;
       offRef.current = sock.onCaption((m) => {
           feedRef.current(m);
           setCurrentCaption(m.text);

           const video = videoRef.current!;
           const track = trackRef.current!;
           if (vttOffsetRef.current == null) {
               vttOffsetRef.current = (video?.currentTime ?? 0) - m.start;
           }
           const offset = vttOffsetRef.current ?? 0;
           const minDuration = 0.6;
           const start = offset + m.start;
           let end = offset + Math.max(m.end, m.start + minDuration);
           if (end <= start) end = start + minDuration;

           let cue = cueMap.current.get(m.index) || null;
           if (!cue) {
               cue = new VTTCue(start, end, m.text);
               cue.id = `c${m.index}`;
               track.addCue(cue);
               cueMap.current.set(m.index, cue);
           } else {
               cue.startTime = start;
               cue.endTime = end;
               cue.text = m.text;
           }
       });

       const recorder = await createRecorder(400);
       const stream = await recorder.start(({index, startSec, endSec}) => {
           socketRef.current?.sendChunk(index, startSec, endSec);
       })

        // Drive the <video> clock with the mic stream
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        const trackEl = document.getElementById('capt') as HTMLTrackElement;
        trackRef.current = trackEl.track;

        setActive(true);
    }

    function stop() {
        offRef.current?.();
        offRef.current = null;
        socketRef.current?.ws.close();
        (window as any).__recorder?.stop?.();
        const video = videoRef.current!;
        if (video) {
            if (video.srcObject) (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            video.srcObject = null;
        }
        vttOffsetRef.current = null;
        cueMap.current.clear();
        setCurrentCaption('');
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

            <div className="mt-3 rounded-xl border bg-white p-3 text-lg font-medium min-h-[3rem]">
                {currentCaption || '…'}
            </div>

            <CaptionsPanel feed={feedRef} />

            {/* Media element + captions track (driven by mic stream) */}
            <video ref={videoRef} className="mt-4 w-full rounded-xl bg-black/5" autoPlay playsInline muted>
                <track id="capt" kind="captions" srcLang="en" default />
            </video>
        </div>
    );
}

export default App;
