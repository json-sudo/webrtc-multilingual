export function MetricsCard({ stats }: { stats: { e2e: any; server: any; render: any } }) {
    const Row = ({ label, s }: any) => (
        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <span className="text-sm font-medium">{label}</span>
            <span className="text-sm tabular-nums text-gray-700">
        p50: {s.p50.toFixed(1)} ms • p90: {s.p90.toFixed(1)} ms <span className="text-gray-400">({s.n})</span>
      </span>
        </div>
    );
    return (
        <div className="mt-4 grid gap-2">
            <Row label="End-to-End" s={stats.e2e} />
            <Row label="Server (ASR+MT)" s={stats.server} />
            <Row label="Render" s={stats.render} />
        </div>
    );
}
