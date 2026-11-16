/**
 * SHILPA AI CRAFT GUIDE — Client API Service
 * 
 * Communicates with backend endpoints at /api/shilpa/*.
 * Gracefully integrates direct Groq AI client inference with:
 * 1. Vite environment variable VITE_GROQ_API_KEY (from .env or build)
 * 2. Local storage custom override if set by user
 * 3. Grounded local knowledge engine (Verified Odisha Records fallback)
 * Works 100% offline, on Vercel, and across all browsers.
 */

import { ShilpaApiResponse, ShilpaStatusResponse, ShilpaArtifactContext, ShilpaSourceReference } from '../types/shilpa';
import { getLocalArtifacts, getLocalDeterministicAnswer, resolveArtifactLocally } from './shilpaLocalRAG';

export { getLocalArtifacts, filterArtifacts } from './shilpaLocalRAG';

/**
 * Returns the currently active Groq API Key.
 * Priority:
 * 1. User runtime custom key from localStorage
 * 2. Injected environment variable VITE_GROQ_API_KEY (from .env)
 */
export function getActiveGroqApiKey(): string {
  if (typeof window !== 'undefined') {
    const customKey = localStorage.getItem('shilpa_custom_groq_key');
    if (customKey && customKey.trim().startsWith('gsk_')) {
      return customKey.trim();
    }
  }

  const envKey = (import.meta.env.VITE_GROQ_API_KEY as string | undefined) ||
                 (import.meta.env.GROQ_API_KEY as string | undefined);
  if (envKey && envKey.trim().startsWith('gsk_')) {
    return envKey.trim();
  }

  return '';
}

/**
 * Sets or clears a custom Groq API Key in localStorage (runtime user override).
 */
export function setCustomGroqApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    const cleanKey = key.trim();
    if (cleanKey.startsWith('gsk_')) {
      localStorage.setItem('shilpa_custom_groq_key', cleanKey);
    } else {
      localStorage.removeItem('shilpa_custom_groq_key');
    }
  }
}

/**
 * Cleans raw model output: eliminates raw tables, cleans bullets, removes stray markdown pipes.
 */
export function cleanCraftResponse(text: string): string {
  if (!text) return '';

  const lines = String(text).split('\n');
  const resultLines: string[] = [];
  let inTable = false;
  let tableHeaders: string[] = [];
  const tableRows: string[][] = [];

  const flushTable = () => {
    if (tableHeaders.length > 0 && tableRows.length > 0) {
      tableRows.forEach(row => {
        if (row.length === 0) return;
        const mainTitle = row[0];
        resultLines.push(`• ${mainTitle}`);
        for (let i = 1; i < row.length; i++) {
          const header = tableHeaders[i] || '';
          const cell = row[i];
          if (cell) {
            if (header && !/^(craft|name|item|title)$/i.test(header.trim())) {
              resultLines.push(`  ${header}: ${cell}`);
            } else {
              resultLines.push(`  ${cell}`);
            }
          }
        }
        resultLines.push('');
      });
    }
    tableHeaders = [];
    tableRows.length = 0;
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (/^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(line)) {
      inTable = true;
      continue;
    }

    if (line.startsWith('|') && line.endsWith('|') && line.includes('|', 1)) {
      const cells = line
        .slice(1, -1)
        .split('|')
        .map(c => c.trim());

      if (!inTable && tableHeaders.length === 0) {
        tableHeaders = cells;
        inTable = true;
      } else {
        tableRows.push(cells);
      }
      continue;
    }

    if (inTable || tableHeaders.length > 0) {
      flushTable();
    }

    resultLines.push(lines[i]);
  }

  if (inTable || tableHeaders.length > 0) {
    flushTable();
  }

  let cleaned = resultLines.join('\n');
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
  cleaned = cleaned.replace(/^\s*\*\s+/gm, '• ');
  cleaned = cleaned.replace(/\*/g, '');
  cleaned = cleaned.replace(/\s*\|\s*/g, ' — ');
  cleaned = cleaned.replace(/\|/g, '');

  const filteredLines: string[] = [];
  let skippingUnknown = false;
  for (const l of cleaned.split('\n')) {
    const trimmed = l.trim().toLowerCase();
    if (trimmed.startsWith('what is unknown')) {
      skippingUnknown = true;
      continue;
    }
    if (skippingUnknown) {
      if (/^(answer|what the records say|source):?$/i.test(trimmed)) {
        skippingUnknown = false;
      } else {
        continue;
      }
    }
    filteredLines.push(l);
  }

  return filteredLines.join('\n').trim();
}

/**
 * Invokes Groq API directly from the client with grounded artifact context.
 */
async function callGroqDirectly(
  apiKey: string,
  userMessage: string,
  artifactId?: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<ShilpaApiResponse | null> {
  const resolved = resolveArtifactLocally(artifactId);
  let contextPrompt = 'No specific artifact is currently selected.';
  let sources: ShilpaSourceReference[] = [
    { title: 'Odisha Craft Dataset', url: '/marketplace', type: 'dataset' }
  ];

  if (resolved) {
    if (resolved.type === 'curated_product') {
      const p = resolved.item;
      contextPrompt = `
Artifact: ${p.name}
Category: ${p.categoryId}
District: ${p.district}, Odisha (${p.locality})
Price: ₹${p.price.toLocaleString('en-IN')}
Materials: ${p.materials.join(', ')}
Breakdown: Materials ₹${p.priceBreakdown.materials}, Labour ₹${p.priceBreakdown.labour}, Overhead ₹${p.priceBreakdown.overhead}, Packaging ₹${p.priceBreakdown.packaging}, Distribution ₹${p.priceBreakdown.distribution}, Margin ₹${p.priceBreakdown.sellerMargin}.
History: ${p.story}
Stages: ${p.manufacturingStages.map(s => `Stage ${s.step}: ${s.title} - ${s.description}`).join('; ')}
`.trim();
      sources = [
        { title: `${p.name} Digital Craft Passport`, url: `/passport/${p.id}`, type: 'digital_passport' },
        { title: 'Odisha State Handloom Directorate Archive', url: 'https://crafts.odisha.gov.in', type: 'government_record' }
      ];
    } else {
      const a = resolved.item;
      contextPrompt = `
Artifact: ${a.name}
Category: ${a.category}
District: ${a.district}, Odisha
Price: ₹${a.priceMin}–₹${a.priceMax} ${a.priceUnit || 'per piece'}
Materials: ${a.category}, ${a.specialNotes || 'Traditional craft materials'}
Artisans: ${a.masterArtisans || 'Craft masters documented'}
History: ${a.history}
Note: A detailed cost breakdown is not available in the current records.
`.trim();
      sources = [
        { title: `Odisha Artifact Registry (${a.district})`, url: `/marketplace?district=${encodeURIComponent(a.district)}`, type: 'official_odisha_dataset' }
      ];
    }
  }

  const prompt = `
You are SHILPA, an authoritative AI Craft Guide for authentic Odisha handicrafts and handlooms on the SHILPA SETU platform.
Answer the patron's question accurately using this verified record:
${contextPrompt}

Question: ${userMessage}

Rules:
- Answer clearly and warmly in natural standard paragraphs.
- Demystify traditional craft terms (like Bandha, Ikat, Chitrakar, Tarakasi, Dhokra) respectfully.
- If price breakdown is not documented, explain the indicative price range and state that a detailed breakdown of materials, labor, finishing, and overhead costs is not documented in public records.
- Never invent cost figures or artisan claims.
`.trim();

  // Try primary model (openai/gpt-oss-120b), fall back to llama-3.3-70b-versatile
  const models = ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile'];

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are SHILPA, an authoritative, culturally respectful AI Craft Guide for authentic Odisha crafts.' },
            ...conversationHistory.slice(-4),
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 600
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const text = json.choices?.[0]?.message?.content || '';
        if (text) {
          return {
            answer: cleanCraftResponse(text),
            sources,
            limitations: resolved?.type === 'odisha_artifact' ? ['Detailed itemized cost breakdown is not documented in public records.'] : [],
            modelUsed: `${model} (Live Groq AI)`
          };
        }
      }
    } catch {
      // Continue to next model or fallback
    }
  }

  return null;
}

export async function askShilpa(
  message: string,
  artifactId?: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<ShilpaApiResponse> {
  const cleanMessage = String(message || '').trim();

  // 1. Try server endpoint first (if backend is active)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch('/api/shilpa/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: cleanMessage,
        artifactId,
        conversationHistory: conversationHistory.slice(-6)
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const data: ShilpaApiResponse = await response.json();
      if (data && data.answer) {
        return data;
      }
    }
  } catch (err: any) {
    // Backend offline; continue to direct Groq client
  }

  // 2. Direct client-side Groq API call with integrated active key
  const apiKey = getActiveGroqApiKey();
  if (apiKey) {
    try {
      const groqRes = await callGroqDirectly(apiKey, cleanMessage, artifactId, conversationHistory);
      if (groqRes && groqRes.answer) {
        return groqRes;
      }
    } catch (e: any) {
      console.warn('[Shilpa Direct Groq Note]:', e?.message);
    }
  }

  // 3. Grounded local knowledge fallback (always guaranteed)
  return getLocalDeterministicAnswer(artifactId, cleanMessage);
}

export async function getShilpaStatus(): Promise<ShilpaStatusResponse | null> {
  const apiKey = getActiveGroqApiKey();

  return {
    status: 'ok',
    assistant: 'SHILPA (AI Craft Guide)',
    tagline: 'Ask SHILPA. Discover the Story Behind Every Craft.',
    groqConfigured: Boolean(apiKey && apiKey.startsWith('gsk_')),
    activeModel: apiKey ? 'openai/gpt-oss-120b (Live Groq AI)' : 'grounded-craft-knowledge (Verified Odisha Records)',
    environment: 'client'
  };
}

export async function getAvailableArtifacts(): Promise<ShilpaArtifactContext[]> {
  const localList = getLocalArtifacts();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch('/api/shilpa/artifacts', { signal: controller.signal });
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      if (Array.isArray(data.artifacts) && data.artifacts.length > 0) {
        // Hydrate server artifacts with local images if missing
        return data.artifacts.map((sa: ShilpaArtifactContext) => {
          if (!sa.image) {
            const localMatch = localList.find(l => l.id === sa.id);
            if (localMatch?.image) sa.image = localMatch.image;
          }
          return sa;
        });
      }
    }
  } catch {
    // Seamless fallback to local dataset
  }

  return localList;
}

/**
 * Generates dynamic suggested questions tailored to the active artifact.
 */
export function getArtifactSuggestedQuestions(artifact?: ShilpaArtifactContext | null): string[] {
  if (!artifact) {
    return [
      "What crafts is Odisha famous for?",
      "Which craft is associated with Puri district?",
      "How do I know if an Odisha artifact is authentic?",
      "Explain the difference between Pattachitra and printed art."
    ];
  }

  const cat = (artifact.category || '').toLowerCase();
  
  if (cat.includes('pattachitra') || cat.includes('painting')) {
    return [
      "What materials are used to make this painting?",
      "How is Pattachitra traditionally created?",
      "Why does this artifact cost its declared price?",
      "What makes this artwork different from a printed painting?",
      "Which district is this craft associated with?",
      "Show me the sources."
    ];
  }

  if (cat.includes('handloom') || cat.includes('saree') || cat.includes('textile')) {
    return [
      "What materials are used in this handloom?",
      "How is the Bandha (Ikat) tie-dye process executed?",
      "Can you explain the declared price breakdown?",
      "Who is the master weaver behind this?",
      "Which district is this craft associated with?",
      "Show me the sources."
    ];
  }

  if (cat.includes('dhokra') || cat.includes('metal')) {
    return [
      "What materials are used in this lost-wax craft?",
      "How is Dhokra metal casting traditionally done?",
      "Explain the declared price of this artifact.",
      "Is this piece unique or mass produced?",
      "Which tribal cluster crafted this piece?",
      "Show me the sources."
    ];
  }

  if (cat.includes('filigree') || cat.includes('silver')) {
    return [
      "What materials and silver purity are used?",
      "How are the micro-wires drawn and soldered in Cuttack?",
      "Explain the declared price breakdown.",
      "Who made this artifact?",
      "Show me the sources."
    ];
  }

  // Default suggestions for any general Odisha craft
  return [
    "What materials are used?",
    "How is it made?",
    "Tell me its cultural significance.",
    "Explain the declared price.",
    "Who made this artifact?",
    "Show me the sources."
  ];
}
