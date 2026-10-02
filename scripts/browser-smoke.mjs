try {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent('<title>browser-search-smoke</title><main>ok</main>');
  const title = await page.title();
  await browser.close();
  if (title !== 'browser-search-smoke') throw new Error('Unexpected browser smoke title.');
  console.log('BROWSER_SMOKE=green');
} catch (error) {
  console.error(`BROWSER_SMOKE=failed ${error.message}`);
  process.exit(1);
}
