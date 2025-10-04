const WebSocket = require('ws');
const { performance } = require('perf_hooks');
const wss = new WebSocket.Server({ port: 8787 });

console.log('[asr-sim] listening ws://localhost:8787');

wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        let isBinary = typeof data !== 'string';
        let msg = null;

        if (!isBinary) {
            try { msg = JSON.parse(data.toString()); } catch { return; }
        } else {
            // binary path reserved for real audio later
            return;
        }

        if (msg?.type !== 'chunk') return;

        const { index, startSec, endSec, t0 } = msg;
        const srvRecv = performance.now();

        const sendCaption = (payload) => {
            const srvSend = performance.now();
            ws.send(JSON.stringify({
                type: 'caption',
                index,
                start: startSec,
                end: endSec,
                final: !!payload.final,
                text: payload.text,
                // timings (client uses these)
                t0,                 // client capture/send mark (ms, client clock)
                srvRecv,            // ms, server clock
                srvSend,            // ms, server clock
                asr_ms: payload.asr_ms ?? 0, // simulated compute
                mt_ms:  payload.mt_ms  ?? 0
            }));
        };

        // Simulate compute + network jitter:
        const asr_ms = 80 + Math.random() * 60;  // 80–140ms
        const mt_ms  = 30 + Math.random() * 40;  // 30–70ms

        // Partial #1
        setTimeout(() => sendCaption({
            text: `simulated speech… #${index}`,
            final: false,
            asr_ms: asr_ms * 0.3, mt_ms: mt_ms * 0.2
        }), 100);

        // Partial #2
        setTimeout(() => sendCaption({
            text: `simulated speech part #${index}`,
            final: false,
            asr_ms: asr_ms * 0.6, mt_ms: mt_ms * 0.6
        }), 350);

        // Final
        setTimeout(() => sendCaption({
            text: `Final caption for chunk ${index}`,
            final: true,
            asr_ms, mt_ms
        }), 1000 + Math.random() * 200);
    });
});
