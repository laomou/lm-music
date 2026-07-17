import { expect, test } from 'playwright/test'

async function mockAudius(page: import('playwright/test').Page) {
  await page.route('https://api.audius.co/v1/tracks/trending?limit=1', async (route) => {
    await route.fulfill({ json: { data: [{ id: 'probe', title: 'Probe', is_streamable: true }] } })
  })
  await page.route('https://api.audius.co/v1/playlists/trending?limit=20', async (route) => {
    await route.fulfill({ json: { data: [] } })
  })
  await page.route('https://api.audius.co/v1/tracks/trending?limit=30', async (route) => {
    await route.fulfill({
      json: {
        data: [
          {
            id: 'track-1',
            title: 'Smoke Test Track',
            duration: 180,
            is_streamable: true,
            artwork: {},
            user: { name: 'LM Music Test' },
          },
        ],
      },
    })
  })
}

test('connect page loads and language selection persists', async ({ page }) => {
  await page.goto('/#/connect')
  await expect(page.getByRole('heading', { name: /Connect your music library/i })).toBeVisible()

  await page.getByLabel('Language').selectOption('zh-CN')
  await expect(page.locator('h1')).toContainText('连接你的')

  await page.reload()
  await expect(page.locator('h1')).toContainText('连接你的')
})

test('Audius source can enter the library and navigate core pages', async ({ page }) => {
  await mockAudius(page)
  await page.goto('/#/connect')

  await page.getByText('Audius', { exact: true }).click()
  await page.getByRole('button', { name: /Browse Audius/i }).click()

  await expect(page).toHaveURL(/#\/playlists/)
  await expect(page.getByRole('heading', { name: /Your playlists/i })).toBeVisible()
  await expect(page.getByText('Audius trending tracks')).toBeVisible()

  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page).toHaveURL(/#\/settings/)
  await expect(page.getByRole('heading', { name: /Your player/i })).toBeVisible()
  await page.getByRole('button', { name: /Back to playlists/i }).click()
  await expect(page).toHaveURL(/#\/playlists/)

  await page.getByRole('button', { name: 'Downloads' }).click()
  await expect(page).toHaveURL(/#\/downloads/)
  await expect(page.getByRole('heading', { name: /Downloaded/i })).toBeVisible()
})
