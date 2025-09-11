import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';

describe('App UI', () => {
    it('renders and toggles mic button state', async () => {
        render(<App />);
        const btn = screen.getByTestId('mic-btn');
        const status = screen.getByTestId('mic-status');
        const mode = screen.getByTestId('mic-mode');

        expect(btn).toHaveTextContent('Start Mic');
        expect(status).toHaveTextContent(/idle/i);

        // Click start (mock in tests)
        await userEvent.click(btn);
        expect(btn).toHaveTextContent('Stop Mic');
        expect(status).toHaveTextContent(/active/i);
        expect(mode).toHaveTextContent(/mock/i);

        // Click stop
        await userEvent.click(btn);
        expect(btn).toHaveTextContent('Start Mic');
        expect(status).toHaveTextContent(/idle/i);
    });
});
