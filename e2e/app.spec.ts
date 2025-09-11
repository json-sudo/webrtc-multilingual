import { test, expect } from '@playwright/test';

test('home loads and mic button toggles text', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /WebRTC Live Captioner/i })).toBeVisible();

    const btn = page.getByTestId('mic-btn');
    await expect(btn).toHaveText(/Start Mic/i);

    await btn.click();
    await expect(btn).toHaveText(/Stop Mic/i);

    await btn.click();
    await expect(btn).toHaveText(/Start Mic/i);
});
