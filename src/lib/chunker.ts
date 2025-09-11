export type PCMChunk = { pcm16: Int16Array; startSec: number; endSec: number; index: number };

export function chunkFloat32ToInt16(
    input: Float32Array,
    sampleRate: number,
    chunkMs = 400
): PCMChunk[] {
    if (chunkMs <= 0) throw new Error('chunkMs must be > 0');
    const chunkSamples = Math.round((sampleRate * chunkMs) / 1000);
    const chunks: PCMChunk[] = [];
    const total = input.length;
    let idx = 0;
    let cursor = 0;

    while (cursor + chunkSamples <= total) {
        const slice = input.subarray(cursor, cursor + chunkSamples);
        const pcm16 = new Int16Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            const s = Math.max(-1, Math.min(1, slice[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        const startSec = (cursor / sampleRate);
        const endSec = ((cursor + chunkSamples) / sampleRate);
        chunks.push({ pcm16, startSec, endSec, index: idx++ });
        cursor += chunkSamples;
    }
    return chunks;
}
