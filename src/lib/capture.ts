export type CaptureHandle = {
    start: () => Promise<MediaStream | { mock: true }>;
    stop: () => void;
    isMock: boolean;
};

// const allowRealMic = import.meta.env.VITE_ALLOW_MIC === 'true';
const allowRealMic = false;

export function createCapture(): CaptureHandle {
    let stream: MediaStream | null = null;
    return {
        isMock: !allowRealMic,
        async start() {
            if (!allowRealMic || !navigator.mediaDevices?.getUserMedia) {
                return { mock: true as const };
            }
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            return stream;
        },
        stop() {
            stream?.getTracks().forEach(t => t.stop());
            stream = null;
        }
    };
}
