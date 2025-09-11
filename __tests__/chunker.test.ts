import { chunkFloat32ToInt16 } from '../src/lib/chunker';

describe('chunkFloat32ToInt16', () => {
    it('splits into ~equal 400ms chunks', () => {
        const sr = 16000;
        const secs = 2; // 2s buffer
        const input = new Float32Array(sr * secs).fill(0.1);
        const chunks = chunkFloat32ToInt16(input, sr, 400);
        // 2000ms / 400ms = 5 exact chunks
        expect(chunks.length).toBe(5);
        for (const c of chunks) {
            expect(c.pcm16.length).toBeCloseTo(sr * 0.4, 0);
            expect(c.endSec - c.startSec).toBeCloseTo(0.4);
        }
    });

    it('throws on invalid chunk size', () => {
        const sr = 16000;
        const input = new Float32Array(sr).fill(0);
        expect(() => chunkFloat32ToInt16(input, sr, 0)).toThrow();
    });
});
