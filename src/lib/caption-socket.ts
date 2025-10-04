export type CaptionMsg = {
    index: number; start: number; end: number; text: string; final: boolean;
    // timings:
    t0: number;          // client-side performance.now() at send time (ms)
    srvRecv?: number;    // server perf clock when received (ms)
    srvSend?: number;    // server perf clock when sent (ms)
    asr_ms?: number;     // server-compute (simulated)
    mt_ms?: number;
};

export function connectSocket(url = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:8787') {
    const ws = new WebSocket(url);
    const listeners: ((m: CaptionMsg) => void)[] = [];

    ws.addEventListener('message', (ev) => {
        try {
            const msg = JSON.parse(ev.data);
            if (msg.type === 'caption') listeners.forEach(fn => fn(msg as CaptionMsg));
        } catch {}
    });

    function onCaption(fn: (m: CaptionMsg) => void) { listeners.push(fn); }

    function sendChunk(index: number, start: number, end: number) {
        const t0 = performance.now();
        ws.send(JSON.stringify({ type: 'chunk', index, startSec: start, endSec: end, t0 }));
    }

    return { ws, onCaption, sendChunk };
}
