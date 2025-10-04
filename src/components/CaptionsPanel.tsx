import React from 'react';
import type { CaptionMsg } from '../lib/caption-socket';

type Row = { index: number; text: string; final: boolean; start: number; end: number };

export function CaptionsPanel({ feed }: { feed: React.RefObject<(m: CaptionMsg) => void> }) {
    const [rows, setRows] = React.useState<Row[]>([]);
    React.useEffect(() => {
        feed.current = (m: CaptionMsg) => {
            setRows(prev => {
                const i = prev.findIndex(r => r.index === m.index);
                if (i >= 0) {
                    const next = prev.slice();
                    next[i] = { ...next[i], text: m.text, final: m.final, start: m.start, end: m.end };
                    return next;
                }
                return [...prev, { index: m.index, text: m.text, final: m.final, start: m.start, end: m.end }];
            });
        };
    }, [feed]);

    return (
        <div className="mt-4 h-48 overflow-auto rounded-xl border bg-gray-50 p-3">
            {rows.map(r => (
                <div key={r.index}
                     className={`mb-1 rounded-md px-2 py-1 ${r.final ? 'bg-white' : 'bg-yellow-50'}`}>
                    <span className="mr-2 text-xs text-gray-500">#{r.index}</span>
                    <span className="font-medium">{r.text}</span>
                    {!r.final && <span className="ml-2 text-xs text-amber-600">(partial)</span>}
                </div>
            ))}
            {rows.length === 0 && <div className="text-sm text-gray-500">Captions will appear here…</div>}
        </div>
    );
}
