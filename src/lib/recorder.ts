export type ChunkMeta = { index: number; startSec: number; endSec: number };
export type RecorderHandle = {
    start: (onChunk: (meta: ChunkMeta, pcm16: Int16Array) => void) => Promise<MediaStream>;
    stop: () => void;
};

const WORKLET_READY = Symbol('workletReady');
const PROCESSOR = 'recorder_v1';

export async function createRecorder(chunkMs = 400): Promise<RecorderHandle> {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const anyCtx = ctx as any;

    if (!anyCtx[WORKLET_READY]) {
        anyCtx[WORKLET_READY] = ctx.audioWorklet
            .addModule('/recorder-worklet.js?v=6')
            .catch((e: any) => {
                console.error('[worklet] failed to load', e);
                throw e;
            });
    }
    await anyCtx[WORKLET_READY];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = ctx.createMediaStreamSource(stream);
    const node = new AudioWorkletNode(ctx, PROCESSOR, { processorOptions: { chunkMs } });

    source.connect(node);

    let onChunkCb: (m: ChunkMeta, pcm16: Int16Array) => void = () => {};
    (node.port as MessagePort).onmessage = (ev: MessageEvent) => {
        const { pcm16, startSec, endSec, index } = ev.data;
        onChunkCb({ index, startSec, endSec }, pcm16 as Int16Array);
    };

    return {
        async start(onChunk) { onChunkCb = onChunk; return stream; },
        stop() {
            try { source.disconnect(); } catch {}
            try { node.disconnect(); } catch {}
            stream.getTracks().forEach(t => t.stop());
            ctx.close();
        }
    };
}
