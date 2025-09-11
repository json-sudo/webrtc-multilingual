import './styles/app.css';
import { MicButton } from './components/MicButton';

function App() {
    return (
        <div className="mx-auto max-w-3xl p-6">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                    WebRTC Live Captioner — Prototype
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                    Week-1 scaffold. Click “Start Mic” to begin (mock in tests/e2e).
                </p>
            </header>

            <section className="rounded-xl border bg-white p-4 shadow-sm">
                <MicButton />
            </section>
        </div>
    );
}

export default App;
