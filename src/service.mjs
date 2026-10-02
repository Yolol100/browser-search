import fs from 'node:fs';
import { loadConfig } from './config.mjs';
import { GoogleBrowserSearch } from './google-browser.mjs';
import { validateSearchInput } from './validation.mjs';

export class SearchService {
  constructor(config = loadConfig()) {
    this.config = config;
    this.google = new GoogleBrowserSearch(config);
  }

  async search(input) {
    const request = validateSearchInput(input, this.config.maxResults, this.config.defaultCountry);
    return this.google.search(request);
  }

  async readiness() {
    try {
      const { chromium } = await import('playwright');
      const executablePath = chromium.executablePath();
      return {
        ready: Boolean(executablePath && fs.existsSync(executablePath)),
        browser: 'chromium',
        executablePresent: Boolean(executablePath && fs.existsSync(executablePath))
      };
    } catch {
      return { ready: false, browser: 'chromium', executablePresent: false };
    }
  }
}
