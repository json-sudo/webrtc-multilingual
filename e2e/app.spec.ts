import { test, expect } from '@playwright/test';

test('home loads and mic button toggles text', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /WebRTC Live Captioner/i })).toBeVisible();

    const startButton = page.getByTestId('start-all');
    const stopButton = page.getByTestId('stop-all');
    await expect(startButton).toHaveText(/Start Mic/i);

    await startButton.click();
    await expect(startButton).toHaveText(/Stop Mic/i);

    await stopButton.click();
    await expect(startButton).toHaveText(/Start Mic/i);
});
