import { useRef, useState } from 'react';
import { createCapture } from '../lib/capture';

export function MicButton() {
    const [active, setActive] = useState(false);
    const [status, setStatus] = useState<'idle'|'starting'|'active'|'error'>('idle');
    const [mode, setMode] = useState<'mock'|'real'>('mock');

    const cap = useRef(createCapture());

    async function onClick() {
        if (!active) {
            setStatus('starting');
            try {
                const result = await cap.current.start();
                setMode('mock' in result ? 'mock' : 'real');
                setActive(true);
                setStatus('active');
            } catch (e) {
                console.error(e);
                setStatus('error');
            }
        } else {
            cap.current.stop();
            setActive(false);
            setStatus('idle');
        }
    }

    return (
        <div>
            <button onClick={onClick} aria-pressed={active} data-testid="mic-btn">
                {active ? 'Stop Mic' : 'Start Mic'}
            </button>
            <div className="small">
                Status: <span className="badge" data-testid="mic-status">{status}</span> •
                Mode: <span className="badge" data-testid="mic-mode">{mode}</span>
            </div>
        </div>
    );
}
