import { getBrowser } from '@/app/lib/browser';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let browser;
  
  try {
    const { url, captureHtml = true } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    console.log('Launching browser...');
    browser = await getBrowser();
    
    console.log('Opening page...');
    const page = await browser.newPage();
    
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    console.log('Navigating to URL...');
    await page.goto(url, { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });

    const fullHtml = captureHtml ? await page.content() : null;

    console.log('Extracting styles...');
    const styleData = await page.evaluate(() => {
      const getComputedStyles = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const styles = window.getComputedStyle(element);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          fontFamily: styles.fontFamily,
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          padding: styles.padding,
          margin: styles.margin,
        };
      };

      const colors = new Set<string>();
      const fonts = new Set<string>();
      
      const elements = Array.from(document.querySelectorAll('body, header, nav, main, footer, h1, h2, h3, p, a, button'));
      
      elements.forEach((el) => {
        const styles = window.getComputedStyle(el);
        if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          colors.add(styles.backgroundColor);
        }
        if (styles.color) {
          colors.add(styles.color);
        }
        if (styles.fontFamily) {
          fonts.add(styles.fontFamily);
        }
      });

      const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
        .slice(0, 5)
        .map(h => h.textContent?.trim())
        .filter(Boolean);

      const metaDesc = document.querySelector('meta[name="description"]');

      return {
        title: document.title,
        description: metaDesc ? metaDesc.getAttribute('content') : '',
        bodyStyles: getComputedStyles('body'),
        headerStyles: getComputedStyles('h1'),
        h2Styles: getComputedStyles('h2'),
        linkStyles: getComputedStyles('a'),
        buttonStyles: getComputedStyles('button'),
        colors: Array.from(colors).slice(0, 20),
        fonts: Array.from(fonts).slice(0, 8),
        headings,
        textContent: document.body.innerText,
      };
    });

    const result = captureHtml ? { ...styleData, fullHtml } : styleData;

    console.log('Closing browser...');
    await browser.close();

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Scraping error:', error);
    
    if (browser) {
      await browser.close().catch(() => {});
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to scrape website', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}