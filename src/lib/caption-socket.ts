export type CaptionMsg = {
    index: number; start: number; end: number; text: string; final: boolean;
    // timings:
    t0: number;          // client-side performance.now() at send time (ms)
    srvRecv?: number;    // server perf clock when received (ms)
    srvSend?: number;    // server perf clock when sent (ms)
    asr_ms?: number;     // server-compute (simulated)
    mt_ms?: number;
};

const DECODER = new TextDecoder();

export function connectSocket(url = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:8787') {
    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';

    const listeners: ((m: CaptionMsg) => void)[] = [];
    function onCaption(fn: (m: CaptionMsg) => void) {
        listeners.push(fn);
        return () => {
            const i = listeners.indexOf(fn);
            if (i >= 0) listeners.splice(i, 1);
        };
    }
    const queue: (string | ArrayBufferLike | Blob | ArrayBufferView)[] = [];
    let isOpen = false;

    ws.addEventListener('open', () => {
        isOpen = true;
        while (queue.length) ws.send(queue.shift()!);
    });

    ws.addEventListener('error', (e) => console.warn('[ws] error', e));
    ws.addEventListener('close', () => console.warn('[ws] closed'));

    ws.addEventListener('message', async (ev) => {
        let raw: unknown = ev.data;
        try {
            if (raw instanceof Blob) raw = await raw.text();
            else if (raw instanceof ArrayBuffer) raw = DECODER.decode(new Uint8Array(raw));
            if (typeof raw !== 'string') return;
            const msg = JSON.parse(raw as string);
            if (msg?.type === 'caption') listeners.forEach(fn => fn(msg as CaptionMsg));
        } catch (e) {
            console.warn('[ws] bad message', e);
        }
    });

    function sendChunk(index: number, start: number, end: number) {
        const payload = JSON.stringify({ type: 'chunk', index, startSec: start, endSec: end, t0: performance.now() });
        if (isOpen && ws.readyState === WebSocket.OPEN) ws.send(payload);
        else queue.push(payload); // buffer until open
    }

    return { ws, onCaption, sendChunk };
}
