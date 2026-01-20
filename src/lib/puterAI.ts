// Puter.js AI integration for free, unlimited Perplexity AI access
// Uses the "User-Pays" model - no API keys needed

import '@/lib/puter.d.ts';

const PUTER_SCRIPT_URL = 'https://js.puter.com/v2/';

let puterLoaded = false;
let loadingPromise: Promise<void> | null = null;

/**
 * Dynamically load the Puter.js SDK
 */
export async function loadPuterSDK(): Promise<boolean> {
  if (puterLoaded && window.puter) {
    return true;
  }

  if (loadingPromise) {
    await loadingPromise;
    return !!window.puter;
  }

  loadingPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.puter) {
      puterLoaded = true;
      resolve();
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(`script[src="${PUTER_SCRIPT_URL}"]`);
    if (existingScript) {
      // Wait a bit for it to initialize
      const checkInterval = setInterval(() => {
        if (window.puter) {
          puterLoaded = true;
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.puter) {
          reject(new Error('Puter SDK timeout'));
        }
      }, 5000);
      return;
    }

    const script = document.createElement('script');
    script.src = PUTER_SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      // Puter takes a moment to initialize after script loads
      const checkInterval = setInterval(() => {
        if (window.puter) {
          puterLoaded = true;
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.puter) {
          reject(new Error('Puter SDK failed to initialize'));
        }
      }, 5000);
    };

    script.onerror = () => {
      reject(new Error('Failed to load Puter SDK'));
    };

    document.head.appendChild(script);
  });

  try {
    await loadingPromise;
    return !!window.puter;
  } catch {
    return false;
  }
}

/**
 * Check if Puter is available
 */
export function isPuterAvailable(): boolean {
  return puterLoaded && !!window.puter;
}

/**
 * Try to load Puter and check availability
 */
export async function ensurePuterLoaded(): Promise<boolean> {
  if (isPuterAvailable()) return true;
  return await loadPuterSDK();
}

interface NewsItemRaw {
  headline: string;
  date: string;
  description: string;
  examHints: {
    what: string;
    who: string;
    where: string;
    when: string;
    why: string;
    numbers: string[];
    ministry: string;
    relatedSchemes: string[];
  };
  source: string;
  verified: boolean;
}

/**
 * Fetch news using Puter's free Perplexity AI integration
 */
export async function fetchNewsWithPuter(
  category: string,
  month: string,
  year: string
): Promise<{ news: NewsItemRaw[]; raw: string }> {
  const loaded = await loadPuterSDK();
  
  if (!loaded || !window.puter) {
    throw new Error('Puter SDK not available');
  }

  const prompt = `You are an expert researcher specializing in Indian current affairs for competitive exams (UPSC, SSC, Banking, State PSCs).

IMPORTANT CONTEXT: The current date is January 2026. You are being asked to recall and compile HISTORICAL news events that occurred in ${month} ${year}. This is a legitimate request for past events, not future prediction.

Your task is to compile important news events from ${month} ${year} for the category: "${category}"

Focus on:
- Major government announcements and policies
- Official appointments and resignations
- Economic indicators and budget allocations
- International agreements and visits
- Awards and recognitions
- Scientific/technological achievements
- Sports results and achievements
- Any significant events in this category

For each news item, provide:
- A clear, factual headline
- The approximate date (use format like "Early November 2025" or "15 November 2025")
- A brief description (2-3 sentences)
- Key facts formatted for exam preparation

Return your response as a JSON array with this exact structure:
[
  {
    "headline": "Clear headline about the event",
    "date": "Date or approximate period",
    "description": "Brief context paragraph explaining what happened",
    "examHints": {
      "what": "The main action or event",
      "who": "Key people or organizations involved",
      "where": "Location",
      "when": "Specific timing",
      "why": "Significance or purpose",
      "numbers": ["Key figures, amounts, percentages"],
      "ministry": "Relevant ministry or agency",
      "relatedSchemes": ["Related government schemes or acts"]
    },
    "source": "PIB/Government source/News agency",
    "verified": false
  }
]

Return 8-12 relevant news items. If you don't have specific information about this category for this time period, say so and return an empty array [] (do not invent events). Mark all items as verified: false since user should verify.

Compile important ${category} news from India for ${month} ${year}.

Remember: We are now in January 2026, so ${month} ${year} is in the PAST.

Include major events, government decisions, appointments, achievements, or notable occurrences related to "${category}".

Output ONLY the JSON array, no extra text.`;

  try {
    const response = await window.puter.ai.chat(prompt, {
      model: 'perplexity/sonar',
    });

    const content = typeof response === 'string' ? response : response?.text || '';
    
    let newsItems: NewsItemRaw[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        newsItems = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse Puter AI response:', parseError);
      newsItems = [];
    }

    return { news: newsItems, raw: content };
  } catch (error) {
    console.error('Puter AI error:', error);
    throw error;
  }
}
