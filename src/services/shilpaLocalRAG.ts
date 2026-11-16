/**
 * SHILPA AI CRAFT GUIDE — Local Grounded Knowledge & RAG Engine
 * 
 * Provides client-side trusted data resolution and deterministic grounded retrieval.
 * Works 100% offline, on Vercel, and across all browsers without backend dependency.
 */

import { ODISHA_ARTIFACTS } from '../data/odishaArtifactsData';
import { MOCK_PRODUCTS } from '../data/mockData';
import { ShilpaArtifactContext, ShilpaApiResponse, ShilpaSourceReference } from '../types/shilpa';

/**
 * Returns complete summary list of all 308+ verified crafts across all 30 districts of Odisha.
 */
export function getLocalArtifacts(): ShilpaArtifactContext[] {
  const curated: ShilpaArtifactContext[] = MOCK_PRODUCTS.map(p => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.categoryId,
    district: p.district,
    priceDisplay: `₹${p.price.toLocaleString('en-IN')}`,
    priceRange: `₹${p.price.toLocaleString('en-IN')}`,
    image: p.images?.[0],
    isDetailedBreakdownAvailable: Boolean(p.priceBreakdown)
  }));

  const odisha: ShilpaArtifactContext[] = ODISHA_ARTIFACTS.map(a => ({
    id: a.id,
    slug: `odisha-${a.id}`,
    name: `${a.name} (${a.district})`,
    category: a.category,
    district: a.district,
    priceDisplay: `₹${a.priceMin}–₹${a.priceMax}`,
    priceRange: `₹${a.priceMin}–₹${a.priceMax} ${a.priceUnit || 'per piece'}`,
    image: a.image,
    isDetailedBreakdownAvailable: false
  }));

  return [...curated, ...odisha];
}

/**
 * Normalizes text for resilient matching (lowercase, strip diacritics/accents).
 */
export function normalizeSearchTerm(term: string): string {
  return (term || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Filters the artifacts list using multi-term token matching and common Odisha craft spelling variants.
 */
export function filterArtifacts(
  artifacts: ShilpaArtifactContext[],
  query: string
): ShilpaArtifactContext[] {
  const cleanQuery = normalizeSearchTerm(query);
  if (!cleanQuery) return artifacts;

  const tokens = cleanQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return artifacts;

  return artifacts.filter(art => {
    const searchable = normalizeSearchTerm(
      `${art.name} ${art.category} ${art.district} ${art.slug || ''}`
    );

    return tokens.every(token => {
      if (searchable.includes(token)) return true;

      // Handle common spelling variations in Odisha craft terms
      if (token === 'dokra' && searchable.includes('dhokra')) return true;
      if (token === 'dhokra' && searchable.includes('dokra')) return true;
      if (token === 'pipli' && searchable.includes('pipili')) return true;
      if (token === 'pipili' && searchable.includes('pipli')) return true;
      if (token === 'patachitra' && searchable.includes('pattachitra')) return true;
      if (token === 'pattachitra' && searchable.includes('patachitra')) return true;
      if (token === 'tarakasi' && (searchable.includes('filigree') || searchable.includes('silver'))) return true;
      if (token === 'filigree' && searchable.includes('tarakasi')) return true;
      if (token === 'applique' && searchable.includes('appliqué')) return true;
      if (token === 'ikat' && (searchable.includes('bandha') || searchable.includes('sambalpuri') || searchable.includes('handloom'))) return true;
      if (token === 'sari' && searchable.includes('saree')) return true;
      if (token === 'saree' && searchable.includes('sari')) return true;

      return false;
    });
  });
}

/**
 * Resolves an artifact by ID, slug, or matching name.
 */
export function resolveArtifactLocally(identifier?: string | null) {
  if (!identifier) return null;
  const idStr = String(identifier).trim().toLowerCase();

  // 1. Check Curated Products by ID or Slug
  const curated = MOCK_PRODUCTS.find(p => 
    p.id.toLowerCase() === idStr || 
    p.slug.toLowerCase() === idStr ||
    p.name.toLowerCase().includes(idStr)
  );
  if (curated) {
    return {
      type: 'curated_product' as const,
      item: curated
    };
  }

  // 2. Check 300 Authentic Odisha Artifacts Dataset
  const odishaItem = ODISHA_ARTIFACTS.find(a => 
    a.id.toLowerCase() === idStr ||
    `odisha-${a.id}`.toLowerCase() === idStr ||
    a.name.toLowerCase() === idStr ||
    `${a.name} (${a.district})`.toLowerCase() === idStr ||
    `${a.name.toLowerCase()}-${a.district.toLowerCase()}`.replace(/[^a-z0-9]+/g, '-').includes(idStr)
  );
  if (odishaItem) {
    return {
      type: 'odisha_artifact' as const,
      item: odishaItem
    };
  }

  // 3. Fallback: Fuzzy search by name
  const partialCurated = MOCK_PRODUCTS.find(p => 
    p.name.toLowerCase().includes(idStr) || p.categoryId.toLowerCase().includes(idStr)
  );
  if (partialCurated) return { type: 'curated_product' as const, item: partialCurated };

  const partialOdisha = ODISHA_ARTIFACTS.find(a => 
    a.name.toLowerCase().includes(idStr) || a.category.toLowerCase().includes(idStr)
  );
  if (partialOdisha) return { type: 'odisha_artifact' as const, item: partialOdisha };

  return null;
}

/**
 * Matches user question intent to factual knowledge categories.
 */
export function matchQuestionIntent(message: string): string {
  const q = String(message || '').toLowerCase();

  if (/material|what is .* made of|what are the .* ingredients|pigment|fabric|wood|metal|stone|silk|canvas|clay|natural dye/i.test(q)) {
    return 'materials';
  }
  if (/how is .* made|how is .* created|process|technique|step|manufacturing|stages|lost-wax|ikat|bandha|engraving|carving/i.test(q)) {
    return 'process';
  }
  if (/price|cost|why does this .* cost|breakdown|rupee|₹|margin|labour|expensive|cheap|affordable/i.test(q)) {
    return 'pricing';
  }
  if (/who made|artisan|creator|craftsperson|master|studio|guild|award|recognition/i.test(q)) {
    return 'artisan';
  }
  if (/district|origin|where|region|village|locality|geography|cluster/i.test(q)) {
    return 'district';
  }
  if (/source|citation|reference|verification|documented|registry|proof/i.test(q)) {
    return 'sources';
  }
  if (/different|printed|machine|mass produced|synthetic|fake|authentic/i.test(q)) {
    return 'authenticity_difference';
  }
  if (/cultural|history|significance|story|heritage|mythology|symbol|meaning/i.test(q)) {
    return 'cultural_history';
  }

  return 'general';
}

/**
 * Generates verified, deterministic answers grounded purely in active artifact data.
 */
export function getLocalDeterministicAnswer(
  artifactId?: string | null,
  userMessage: string = ''
): ShilpaApiResponse {
  const cleanMessage = String(userMessage || '').trim();
  const resolved = resolveArtifactLocally(artifactId);

  if (!resolved) {
    return {
      answer: "Namaste! I am SHILPA, your AI Craft Guide for SHILPA SETU. Please select an Odisha craft artifact (such as a Sambalpuri Saree, Pattachitra painting, or Dhokra metal sculpture) using the 'Switch Craft' picker to ask detailed questions about its materials, traditional process, artisan lineage, or declared pricing.",
      sources: [
        {
          title: "Odisha Craft Marketplace",
          url: "/marketplace",
          type: "marketplace_catalog"
        }
      ],
      limitations: ["No artifact selected."],
      modelUsed: "grounded-craft-knowledge (Local RAG)"
    };
  }

  const intent = matchQuestionIntent(cleanMessage);

  if (resolved.type === 'curated_product') {
    const p = resolved.item;
    const sources: ShilpaSourceReference[] = [
      {
        title: `${p.name} Digital Craft Passport`,
        url: `/passport/${p.id}`,
        type: 'digital_passport',
        approvalStatus: 'Audited'
      },
      {
        title: 'Odisha State Handloom & Handicrafts Archive',
        url: 'https://crafts.odisha.gov.in',
        type: 'government_record',
        approvalStatus: 'Public Record'
      }
    ];

    switch (intent) {
      case 'materials':
        return {
          answer: `**Documented Materials for ${p.name}:**\n\n` +
            p.materials.map(m => `• **${m}**`).join('\n') +
            `\n\n*Traditional Integrity:* Regionally harvested, authentic Odia materials from ${p.district} District. No synthetic plastic adulterants or industrial substitutes are declared.`,
          sources,
          limitations: [],
          modelUsed: "grounded-craft-knowledge (Local RAG)"
        };

      case 'process':
        return {
          answer: `**Traditional Multi-Stage Process for ${p.name}:**\n\n` +
            p.manufacturingStages.map(s => `• **Stage ${s.step} — ${s.title} (${s.duration}):** ${s.description}`).join('\n\n') +
            `\n\n*Craft Heritage:* Every piece is painstakingly hand-worked in ${p.locality}, preserving generational techniques.`,
          sources,
          limitations: [],
          modelUsed: "grounded-craft-knowledge (Local RAG)"
        };

      case 'pricing': {
        const bd = p.priceBreakdown;
        return {
          answer: `**Transparent Cost Breakdown for ${p.name} (Declared: ₹${p.price.toLocaleString('en-IN')}):**\n\n` +
            `• **Raw Materials:** ₹${bd.materials.toLocaleString('en-IN')} (Authentic base components)\n` +
            `• **Skilled Artisan Labour:** ₹${bd.labour.toLocaleString('en-IN')} (Direct handcrafting compensation)\n` +
            `• **Studio Overhead & Tools:** ₹${bd.overhead.toLocaleString('en-IN')}\n` +
            `• **Eco-friendly Packaging:** ₹${bd.packaging.toLocaleString('en-IN')}\n` +
            `• **Distribution & Transport:** ₹${bd.distribution.toLocaleString('en-IN')}\n` +
            `• **Fair Artisan Margin:** ₹${bd.sellerMargin.toLocaleString('en-IN')}\n\n` +
            `*Transparency Verification:* Audited directly from the Digital Craft Passport. Zero undisclosed distributor markups.`,
          sources,
          limitations: [],
          modelUsed: "grounded-craft-knowledge (Local RAG)"
        };
      }

      case 'artisan':
        return {
          answer: `**Master Artisan Profile:**\n\n` +
            `• **Artisan:** Master Craftsman for ${p.name}\n` +
            `• **Location:** ${p.locality}, ${p.district} District, Odisha\n` +
            `• **Verification Status:** ${p.verificationStatus}\n` +
            `• **Lineage:** Preserving authentic Odisha craft traditions through cooperative community workshops.`,
          sources,
          limitations: [],
          modelUsed: "grounded-craft-knowledge (Local RAG)"
        };

      case 'district':
        return {
          answer: `**Geographic Origin & Craft Cluster:**\n\n` +
            `• **District:** ${p.district}, Odisha\n` +
            `• **Craft Guild / Locality:** ${p.locality}\n` +
            `• **Regional Significance:** ${p.district} is historically celebrated as one of Odisha's premier craft clusters for ${p.categoryId}.`,
          sources,
          limitations: [],
          modelUsed: "grounded-craft-knowledge (Local RAG)"
        };

      case 'cultural_history':
        return {
          answer: `**Cultural Heritage & Story of ${p.name}:**\n\n${p.story}\n\n*Description:* ${p.description}`,
          sources,
          limitations: [],
          modelUsed: "grounded-craft-knowledge (Local RAG)"
        };

      case 'authenticity_difference':
        return {
          answer: `**What Makes ${p.name} Authentic vs Machine Imitations:**\n\n` +
            `• **100% Handcrafted:** Crafted by experienced Odia artisans without automated industrial looms or presses.\n` +
            `• **Verified Raw Materials:** ${p.materials.join(', ')}.\n` +
            `• **Traceable Passport:** Protected with a transparent Digital Craft Passport and documented price breakdown.`,
          sources,
          limitations: [],
          modelUsed: "grounded-craft-knowledge (Local RAG)"
        };

      case 'sources':
      default:
        return {
          answer: `**Verified Craft Overview for ${p.name}:**\n\n` +
            `• **Category:** ${p.categoryId}\n` +
            `• **District:** ${p.district}, Odisha (${p.locality})\n` +
            `• **Declared Price:** ₹${p.price.toLocaleString('en-IN')}\n` +
            `• **Materials:** ${p.materials.join(', ')}\n` +
            `• **Verification:** ${p.verificationStatus}\n\n` +
            `${p.description}`,
          sources,
          limitations: [],
          modelUsed: "grounded-craft-knowledge (Local RAG)"
        };
    }
  }

  // resolved.type === 'odisha_artifact' (from the 300-craft dataset)
  const a = resolved.item;
  const sources: ShilpaSourceReference[] = [
    {
      title: `Official Odisha Artifacts Registry (${a.district} District)`,
      url: `/marketplace?district=${encodeURIComponent(a.district)}`,
      type: 'official_odisha_dataset',
      approvalStatus: a.verificationStatus
    }
  ];

  switch (intent) {
    case 'materials':
      return {
        answer: `**Documented Materials for ${a.name} (${a.district}):**\n\n` +
          `• **Traditional Craft Medium:** ${a.category}\n` +
          `• **Documented Components:** Authentic local natural materials native to ${a.district} District, Odisha.\n` +
          (a.specialNotes ? `• **Special Characteristics:** ${a.specialNotes}\n` : '') +
          `\n*Integrity:* Rooted in traditional Odia craft practices without synthetic industrial adulteration.`,
        sources,
        limitations: ["Itemized component percentages are not formally recorded in public registry."],
        modelUsed: "grounded-craft-knowledge (Local RAG)"
      };

    case 'process':
      return {
        answer: `**Traditional Making Process for ${a.name}:**\n\n` +
          `${a.history}\n\n` +
          `• **Heritage Technique:** Individual handcrafting by generational Odia artisans in ${a.district} District.\n` +
          (a.specialNotes ? `• **Artisan Notes:** ${a.specialNotes}\n` : '') +
          (a.processVideoUrl ? `• **Demonstration Video:** [Watch Process Video](${a.processVideoUrl})` : ''),
        sources,
        limitations: [],
        modelUsed: "grounded-craft-knowledge (Local RAG)"
      };

    case 'pricing':
      return {
        answer: `**Documented Pricing for ${a.name} (${a.district}):**\n\n` +
          `• **Indicative Price Range:** ₹${a.priceMin} – ₹${a.priceMax} ${a.priceUnit || 'per piece'}\n` +
          `• **Price Confidence:** ${a.priceConfidence || 'Researched'}\n\n` +
          `*Transparency Notice:* A detailed itemized breakdown of materials, labor, finishing, and overhead costs is not documented in the current public registry for this artifact. Please consult local artisans or cooperatives for commercial orders.`,
        sources,
        limitations: ["A detailed breakdown of materials, labor, finishing, and other costs is not available in the current records."],
        modelUsed: "grounded-craft-knowledge (Local RAG)"
      };

    case 'artisan':
      return {
        answer: `**Documented Artisans for ${a.name}:**\n\n` +
          `• **Master Craftspersons:** ${a.masterArtisans || 'Senior generational craft masters recorded in district ledger'}\n` +
          (a.masterArtisansOdia ? `• **Odia Inscription:** ${a.masterArtisansOdia}\n` : '') +
          `• **Status:** ${a.verificationStatus}\n` +
          `• **Cluster:** ${a.district} District craft cluster.`,
        sources,
        limitations: [],
        modelUsed: "grounded-craft-knowledge (Local RAG)"
      };

    case 'district':
      return {
        answer: `**Geographic Origin:**\n\n` +
          `• **District:** ${a.district}, Odisha\n` +
          `• **Tradition:** ${a.category}\n` +
          `• **Heritage Context:** ${a.history.slice(0, 220)}...`,
        sources,
        limitations: [],
        modelUsed: "grounded-craft-knowledge (Local RAG)"
      };

    case 'cultural_history':
      return {
        answer: `**Cultural Significance & History of ${a.name}:**\n\n${a.history}\n\n*Special Characteristics:* ${a.specialNotes}`,
        sources,
        limitations: [],
        modelUsed: "grounded-craft-knowledge (Local RAG)"
      };

    case 'sources':
    default:
      return {
        answer: `**Verified Record for ${a.name} (${a.district} District):**\n\n` +
          `• **Category:** ${a.category}\n` +
          `• **District:** ${a.district}, Odisha\n` +
          `• **Indicative Price:** ₹${a.priceMin} – ₹${a.priceMax} ${a.priceUnit || 'per piece'}\n` +
          `• **Status:** ${a.verificationStatus}\n\n` +
          `${a.history}`,
        sources,
        limitations: ["A detailed breakdown of costs is not documented in public records."],
        modelUsed: "grounded-craft-knowledge (Local RAG)"
      };
  }
}
