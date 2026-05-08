import { expect, test } from '@playwright/test'

test.describe('Auth and navigation shell', () => {
  test('redirects anonymous user to login', async ({ page }) => {
    await page.goto('/medications')
    await expect(page).toHaveURL(/\/login/)
  })

  test('health page has public SEO title', async ({ page }) => {
    await page.goto('/health')
    await expect(page).toHaveTitle(/Health/i)
  })
})
