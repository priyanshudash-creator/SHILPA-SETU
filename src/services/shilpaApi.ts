/**
 * SHILPA AI CRAFT GUIDE — Client API Service
 * 
 * Communicates with backend endpoints at /api/shilpa/*.
 * Gracefully and seamlessly falls back to:
 * 1. Direct Groq API client call if VITE_GROQ_API_KEY is configured
 * 2. Grounded local knowledge engine (Verified Odisha Records)
 * Works 100% offline, on Vercel, and across all browsers.
 */

import { ShilpaApiResponse, ShilpaStatusResponse, ShilpaArtifactContext, ShilpaSourceReference } from '../types/shilpa';
import { getLocalArtifacts, getLocalDeterministicAnswer, resolveArtifactLocally } from './shilpaLocalRAG';

export { getLocalArtifacts, filterArtifacts } from './shilpaLocalRAG';

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
You are SHILPA, an AI Craft Guide for authentic Odisha handicrafts and handlooms.
Answer the patron's question accurately using this verified record:
${contextPrompt}

Question: ${userMessage}
Answer clearly and warmly. If price breakdown is not documented, explain the indicative price range and state that itemized cost breakdown is not documented. Never fabricate costs.
`.trim();

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: 'You are SHILPA, an authoritative AI Craft Guide for authentic Odisha crafts.' },
        ...conversationHistory.slice(-4),
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 600
    })
  });

  if (!res.ok) return null;
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content || '';
  if (!text) return null;

  return {
    answer: text.replace(/\*\*/g, '').replace(/\|/g, ''),
    sources,
    limitations: resolved?.type === 'odisha_artifact' ? ['Detailed itemized cost breakdown is not documented in public records.'] : [],
    modelUsed: 'openai/gpt-oss-120b (Live Groq Inference)'
  };
}

export async function askShilpa(
  message: string,
  artifactId?: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<ShilpaApiResponse> {
  const cleanMessage = String(message || '').trim();

  // 1. Try server endpoint first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

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
    console.warn('[Shilpa API Client Note]: Backend chat endpoint unreachable.', err?.message);
  }

  // 2. Direct client Groq API call if VITE_GROQ_API_KEY is available
  const clientKey = (import.meta.env.VITE_GROQ_API_KEY as string | undefined) || '';
  if (clientKey && clientKey.startsWith('gsk_')) {
    try {
      const groqRes = await callGroqDirectly(clientKey, cleanMessage, artifactId, conversationHistory);
      if (groqRes && groqRes.answer) {
        return groqRes;
      }
    } catch (e: any) {
      console.warn('[Shilpa Direct Groq Note]: Direct Groq call fallback.', e?.message);
    }
  }

  // 3. Resilient fallback: ground answer directly in verified Odisha craft records
  return getLocalDeterministicAnswer(artifactId, cleanMessage);
}

export async function getShilpaStatus(): Promise<ShilpaStatusResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch('/api/shilpa/status', { signal: controller.signal });
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      return await response.json();
    }
  } catch {
    // Graceful fallback
  }

  const clientKey = (import.meta.env.VITE_GROQ_API_KEY as string | undefined) || '';

  return {
    status: 'ok',
    assistant: 'SHILPA (AI Craft Guide)',
    tagline: 'Ask SHILPA. Discover the Story Behind Every Craft.',
    groqConfigured: Boolean(clientKey && clientKey.startsWith('gsk_')),
    activeModel: clientKey ? 'openai/gpt-oss-120b (Live Groq)' : 'grounded-craft-knowledge (Verified Odisha Records)',
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
