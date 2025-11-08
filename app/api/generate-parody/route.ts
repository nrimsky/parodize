import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { styleData } = await request.json();

    // Extract and limit text content and HTML
    const textSnippet = (styleData.textContent || '').substring(0, 10_000);
    const htmlSnippet = (styleData.fullHtml || '').substring(0, 10_000);

    // Create a clean copy of styleData without the large text fields
    const cleanStyleData = { ...styleData };
    delete cleanStyleData.textContent;
    delete cleanStyleData.fullHtml;
    
    const styleJson = JSON.stringify(cleanStyleData, null, 2);

    const prompt = `Help me create a fun parody version of a website.

**Original Site Style Info (JSON):**
${styleJson}

**Sample Content:**
${textSnippet}

**Sample of HTML:**
${htmlSnippet}

Based on this, create a parody version:
1. Use the EXACT same color scheme. If the original site uses specific RGB values, use those exact values. Ensure the same colors are visible on the parody site.
2. Use the EXACT same fonts.
3. But replace ALL content with parody, satirical content.
4. If there are buttons/links, make their text funny but keep the styling.
5. Ensure your parody captures the essence of the original site's purpose.
6. Generate additional text content for the website as needed to make it look realistic.
7. Prefer subtle, understated humor.

Return ONLY valid HTML with inline CSS. 
Make it a complete, standalone HTML page that looks structurally similar.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 10_000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    let htmlContent = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    // Strip markdown code blocks if present
    if (htmlContent.startsWith('```html')) {
      htmlContent = htmlContent
        .replace(/```html\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
    }

    return NextResponse.json({ success: true, html: htmlContent });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate parody', details: (error as Error).message },
      { status: 500 }
    );
  }
}