import { test, expect } from '@playwright/test';

test('captions appear after Start', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('start-all')).toBeVisible();
    await page.getByTestId('start-all').click();
    // await expect(page.getByText(/simulated speech part/i)).toBeVisible();
    await page.waitForTimeout(1500);
    await expect(page.getByText(/Final caption for chunk/i)).toBeVisible();
});
