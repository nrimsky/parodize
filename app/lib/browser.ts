import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function getBrowser() {
  // Check if we're running locally or on Vercel
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // Local development - use regular puppeteer
    const puppeteerRegular = await import('puppeteer');
    return await puppeteerRegular.default.launch({
      headless: true,
    });
  } else {
    // Production (Vercel) - use chromium binary
    return await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }
}