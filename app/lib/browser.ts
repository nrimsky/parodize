import { chromium } from 'playwright-core';
import chromiumPkg from '@sparticuz/chromium';

export async function getBrowser() {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // Local development
    const { chromium: localChromium } = await import('playwright');
    return await localChromium.launch({
      headless: true,
    });
  } else {
    // Production (Vercel)
    return await chromium.launch({
      args: chromiumPkg.args,
      executablePath: await chromiumPkg.executablePath('/tmp/chromium'),
      headless: true,
    });
  }
}