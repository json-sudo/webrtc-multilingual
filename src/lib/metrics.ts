export function percentile(arr: number[], p: number) {
    if (!arr.length) return 0;
    const a = [...arr].sort((x, y) => x - y);
    const idx = Math.min(a.length - 1, Math.max(0, Math.floor((p / 100) * (a.length - 1))));
    return a[idx];
}

export class Metrics {
    e2e: number[] = [];
    srv: number[] = []; // asr+mt
    render: number[] = [];
    max = 500;

    pushE2E(ms: number)    { this._push(this.e2e, ms); }
    pushSrv(ms: number)    { this._push(this.srv, ms); }
    pushRender(ms: number) { this._push(this.render, ms); }

    snapshot() {
        const snap = (xs: number[]) => ({
            p50: percentile(xs, 50), p90: percentile(xs, 90), n: xs.length
        });
        return { e2e: snap(this.e2e), server: snap(this.srv), render: snap(this.render) };
    }

    _push(xs: number[], v: number) { xs.push(v); if (xs.length > this.max) xs.shift(); }
}
