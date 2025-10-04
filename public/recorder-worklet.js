class Recorder extends AudioWorkletProcessor {
    constructor(options) {
        super();
        const chunkMs = (options?.processorOptions?.chunkMs ?? 400) | 0;

        this.outSr = 16000;
        this.inSr = sampleRate;
        this.factor = this.inSr / this.outSr;
        this.integerFactor = Number.isInteger(this.factor);

        this.chunkSamples = Math.round(this.outSr * (chunkMs / 1000));
        this.index = 0;

        this.leftover = new Float32Array(0);  // carryover input
        this.outBuf = new Float32Array(0);    // accumulated 16k samples
        this.phase = 0;                       // for non-integer resampling
    }

    _concat(a, b) {
        if (!a?.length) return b;
        if (!b?.length) return a;
        const out = new Float32Array(a.length + b.length);
        out.set(a); out.set(b, a.length);
        return out;
    }

    _resampleTo16k(input) {
        let buf = this._concat(this.leftover, input);
        this.leftover = new Float32Array(0);

        if (this.inSr === this.outSr) return { out: buf, leftover: new Float32Array(0) };

        if (this.integerFactor) {
            const step = this.factor | 0;
            const outLen = Math.floor(buf.length / step);
            const out = new Float32Array(outLen);
            for (let j = 0, i = 0; j < outLen; j++, i += step) out[j] = buf[i];
            const consumed = outLen * step;
            const leftover = buf.subarray(consumed);
            return { out, leftover };
        }

        const step = this.inSr / this.outSr;
        if (buf.length < 2) return { out: new Float32Array(0), leftover: buf };

        const usable = Math.max(0, buf.length - 1 - this.phase);
        const outLen = Math.floor(usable / step);
        if (outLen <= 0) return { out: new Float32Array(0), leftover: buf };

        const out = new Float32Array(outLen);
        let pos = this.phase;
        for (let j = 0; j < outLen; j++) {
            const i0 = Math.floor(pos);
            const frac = pos - i0;
            const s0 = buf[i0];
            const s1 = buf[i0 + 1] ?? s0;
            out[j] = s0 + (s1 - s0) * frac;
            pos += step;
        }
        const consumed = Math.min(buf.length, Math.floor(pos));
        const leftover = buf.subarray(consumed);
        this.phase = pos - Math.floor(pos);
        return { out, leftover };
    }

    _postChunksFrom(out16k) {
        this.outBuf = this._concat(this.outBuf, out16k);
        while (this.outBuf.length >= this.chunkSamples) {
            const chunk = this.outBuf.subarray(0, this.chunkSamples);
            const rest = this.outBuf.subarray(this.chunkSamples);
            const next = new Float32Array(rest.length);
            next.set(rest);
            this.outBuf = next;

            const pcm16 = new Int16Array(chunk.length);
            for (let i = 0; i < chunk.length; i++) {
                const s = Math.max(-1, Math.min(1, chunk[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }

            const startSec = (this.index * this.chunkSamples) / this.outSr;
            const endSec = ((this.index + 1) * this.chunkSamples) / this.outSr;
            this.port.postMessage({ pcm16, startSec, endSec, index: this.index });
            this.index++;
        }
    }

    process(inputs) {
        const ch0 = inputs[0]?.[0];
        if (!ch0) return true;
        const { out, leftover } = this._resampleTo16k(ch0);
        this.leftover = leftover;
        if (out.length) this._postChunksFrom(out);
        return true;
    }
}

(() => {
    const g = globalThis;
    const NAME = 'recorder_v1';
    if (!g.__RECORDER_V1__) {
        try {
            try { console.log('[recorder-worklet] loaded at SR=', sampleRate); } catch {}
            registerProcessor(NAME, Recorder);
        } catch (e) {
            //
        }
        g.__RECORDER_V1__ = true;
    }
})();
