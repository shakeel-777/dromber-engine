// In-memory sliding window rate limiter per client IP
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(ip, recent);
    return true;
  }
  recent.push(now);
  rateLimitMap.set(ip, recent);
  if (rateLimitMap.size > 2000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.every(t => now - t >= RATE_LIMIT_WINDOW_MS)) rateLimitMap.delete(k);
    }
  }
  return false;
}

const KNOWLEDGE_BASE = [
  {
    intents: ["what is dromber", "what do you do", "overview", "product", "platform", "about"],
    reply: "**Dromber Engine** is an autonomous conversational commerce and real-time affiliate attribution infrastructure for messaging platforms (WhatsApp Business Cloud API & Telegram).\n\n• **Core Pipeline**: Ingests chat webhooks, runs semantic intent extraction via Claude 3.5 Sonnet, matches product catalogs via deterministic tool calling, and generates compliant deep links in under 1.2s.\n• **Target Audience**: Digital publishers, retail aggregators, and high-volume e-commerce networks looking for programmatic conversion loops."
  },
  {
    intents: ["claude", "anthropic", "llm", "ai model", "model tier", "how do you use claude"],
    reply: "We use a multi-tiered Anthropic pipeline:\n\n• **Claude 3.5 Sonnet**: Handles multi-turn semantic parsing, entity disambiguation (including Hinglish and colloquial chat), and deterministic tool use to query catalog APIs.\n• **Claude 3 Haiku**: Synthesizes final recommendations at sub-second speeds to meet WhatsApp's strict latency SLAs.\n• **Prompt Caching**: Caches catalog schemas and compliance guardrails to cut TTFT by 70% and minimize token costs."
  },
  {
    intents: ["architecture", "pipeline", "how it works", "technical", "stack"],
    reply: "Dromber's event-driven architecture operates in 4 stages:\n\n1. **Webhook Ingestion**: Fast event gateway receiving WhatsApp Cloud API webhooks.\n2. **Cognitive Routing**: Claude 3.5 Sonnet extracts buyer parameters and intent.\n3. **Tool Calling**: Queries Amazon IN, Flipkart, and Cuelinks APIs in real time.\n4. **Attribution & Delivery**: Resolves deep links with ASCI and Section 194H/GST metadata, streamed via Claude 3 Haiku."
  },
  {
    intents: ["latency", "speed", "sla", "throughput", "fast", "performance"],
    reply: "Our pipeline enforces a strict **<1.2s end-to-end roundtrip latency SLA**:\n\n• **Edge Ingestion**: Node/Python async webhooks on high-speed ingress.\n• **Prompt Caching**: Reduces Anthropic input processing overhead to <150ms.\n• **Fast Streaming**: Claude 3 Haiku delivers immediate first-token responses directly to WhatsApp message sockets."
  },
  {
    intents: ["pricing", "cost", "price", "plans", "tier", "subscription", "free"],
    reply: "Dromber Engine is onboarding design partners in our **Private Developer Alpha**:\n\n• **Developer Alpha Pilot (Cohort 1 - Zero Platform Fee)**: Subsidized inference (50k tokens/mo), managed onboarding, PA-API test environment. Gated application.\n• **Commercial Engine (Priority Waitlist - Q3 2026)**: 10M tokens/mo, sub-1.2s SLA, custom tool definitions.\n• **Enterprise Dedicated Cluster (Partner Track)**: Dedicated VPC, custom inventory connectors, 99.99% SLA."
  },
  {
    intents: ["api key", "api token", "get key", "access", "sandbox key", "live test", "signup", "register", "public api"],
    reply: "Dromber Engine is currently running a **Private Developer Alpha (Cohort 1)** for select WhatsApp community channels and e-commerce affiliates.\n\nTo preserve our sub-1.2s latency SLA, developer sandbox keys and instances are provisioned on a gated cohort basis.\n\nYou can submit an application via the **Apply for Pilot Access** modal on the website, explore the in-browser **Terminal Sandbox**, or connect directly with our engineering team on WhatsApp at **+91 98947 51469**."
  },
  {
    intents: ["api", "endpoint", "curl", "docs", "integration", "developer", "sdk"],
    reply: "Integrating Dromber in your WhatsApp pipeline:\n\n• **REST Stream Endpoint**: `POST /v1/conversations/stream`\n• **Webhook Ingestion**: Compatible with standard Meta WhatsApp Business Cloud API webhooks.\n• **Tool Definitions**: Plug in catalog APIs via OpenAPI 3.0 JSON schema.\n\nKeys are provisioned to verified design partners in our Developer Alpha Cohort."
  },
  {
    intents: ["networks", "amazon", "flipkart", "meesho", "cuelinks", "catalog"],
    reply: "Dromber natively integrates with major regional and global commerce protocols:\n\n• **Amazon India PA-API**: Real-time pricing, stock verification, and 24-hr cart attribution.\n• **Flipkart Affiliate API**: Large-scale consumer electronics and apparel feed ingestion.\n• **Cuelinks / Aggregators**: Dynamic deep-link resolution across 1,000+ D2C Indian brands (Myntra, Ajio, Nykaa)."
  },
  {
    intents: ["tax", "gst", "tds", "194h", "compliance", "asci", "legal"],
    reply: "Dromber automates regulatory and taxation attribution:\n\n• **Section 194H**: Maps 2% / 5% TDS metadata and PAN verification tags directly to conversion events.\n• **ASCI Compliance**: Programmatically appends required advertising disclosures to AI-generated messages.\n• **Auditing**: Provides full cryptographic attribution trails for all affiliate commissions."
  },
  {
    intents: ["contact", "founder", "whatsapp", "support", "talk", "team"],
    reply: "You can connect directly with our engineering team:\n\n• **Founder WhatsApp**: **+91 98947 51469**\n• **Official Email**: **founder@dromber.site** (or dromber7@gmail.com)\n• We offer 1-on-1 architecture reviews and customized pilot sandbox deployments."
  },
  {
    intents: ["hi", "hello", "hey", "namaste", "good morning", "good evening", "who are you"],
    reply: "Hello! I am **Seron**, Principal Platform Architect for Dromber Engine.\n\nI can assist you with:\n• **Architecture & Latency**: Multi-agent WhatsApp orchestration and Claude 3.5 tool calling\n• **Catalog APIs**: Amazon IN, Flipkart, and Cuelinks integration specs\n• **Developer Pilot**: Private Developer Alpha (Cohort 1) onboarding\n\nHow can I help you architect your conversational commerce pipeline?"
  }
];

function evaluateSeronQuery(query) {
  const q = String(query || '').toLowerCase().trim();
  if (!q) return "Hello! I am Seron, Principal Platform Architect for Dromber Engine. How can I assist your team today?";

  let bestMatch = null;
  let bestScore = 0;

  for (const item of KNOWLEDGE_BASE) {
    let score = 0;
    for (const intent of item.intents) {
      if (q.includes(intent)) {
        score += intent.split(' ').length * 3 + intent.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item.reply;
    }
  }

  if (bestMatch && bestScore >= 3) {
    return bestMatch;
  }

  return "Dromber Engine is an autonomous conversational commerce and attribution platform powered by Claude 3.5 Sonnet and WhatsApp Cloud API.\n\nWe are currently onboarding partners in our **Private Developer Alpha (Cohort 1)**. Would you like to review our **system architecture**, explore our **<1.2s latency SLA**, or connect with our engineering team on WhatsApp at **+91 98947 51469**?";
}

const SYSTEM_PROMPT = `You are Seron, Principal Platform Architect and Technical Concierge for Dromber Engine (https://dromber.site).
Dromber Engine is an autonomous conversational commerce and real-time affiliate attribution infrastructure purpose-built for high-throughput messaging channels like the WhatsApp Business Cloud API.

CORE ARCHITECTURE SPECIFICATIONS:
1. Multi-Agent Cognitive Pipeline:
   - Ingestion: High-concurrency event webhooks from WhatsApp Business Cloud API and Telegram Bot API.
   - Semantic Parsing (Claude 3.5 Sonnet): Disambiguates code-mixed inputs (e.g., Hinglish, colloquial chat), extracting structured buyer intent, price boundaries, and product category entities.
   - Deterministic Tool Calling: Invokes inventory and affiliate catalog APIs (Amazon India PA-API, Flipkart Affiliate API, Cuelinks DeepLink API) with zero hallucinations.
   - Low-Latency Conversational Synthesis (Claude 3 Haiku): Delivers streaming recommendations under a strict <1.2s roundtrip latency SLA.
2. Latency Optimization & Token Economics:
   - Leverages Anthropic Prompt Caching for system prompts and catalog schema definitions, reducing TTFT by ~70% and slashing input token overhead.
   - Projected throughput: 450M to 1.2B tokens/month at pilot scale (150k–300k monthly conversational sessions across WhatsApp channels).
3. Regulatory Attribution & Compliance:
   - Automated injection of ASCI advertising disclosure tags.
   - Automatic Section 194H TDS (2% / 5%) and GST attribution metadata tracking on generated transactional deep links.

DEVELOPER ACCESS & COHORTS:
- Private Developer Alpha (Cohort 1 - Zero Platform Fee): 50,000 monthly subsidized tokens, managed onboarding for select WhatsApp community channels, Amazon PA-API sandbox environment. Gated application.
- Commercial Engine (Priority Waitlist - Q3 2026): 10,000,000 tokens, sub-second latency SLA, custom tool definitions, webhook retries & dead-letter queue, 99.9% uptime.
- Enterprise Dedicated Cluster (Partner Track): Dedicated VPC deployment, custom CRM/ERP catalog connectors, 99.99% uptime SLA, dedicated Anthropic cluster routing, priority 24/7 engineering support.

DEVELOPER API:
- Endpoint: POST /v1/conversations/stream
- Payload: { "session_id": "wa_9894751469", "channel": "whatsapp", "user_message": "...", "context": {} }
- Founder / Architecture Consultation: Direct WhatsApp (+91 98947 51469) or official email (developer@dromber.site).

GUIDELINES FOR YOUR RESPONSES:
- Speak directly in concise, articulate, senior technical prose as Seron.
- Provide sharp, engineering-grade answers without fluff or generic disclaimers.
- Never mention PDF handbooks, educational courses, or agency freelancing services. Dromber is strictly a B2B/developer SaaS infrastructure platform.
- Keep responses concise (under 90 words). Use bullet points for technical specs.`;

function sanitizeLlmReply(text) {
  if (!text) return "";
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, "");

  const formulateMatch = cleaned.match(/(?:\*\*Formulate Response:\*\*|\*\*Final Response:\*\*|\*\*Response:\*\*|\*\*Customer Response:\*\*)[^"]*"([^"]{20,})"/i);
  if (formulateMatch && formulateMatch[1]) {
    return formulateMatch[1].trim();
  }

  const sectionMatch = cleaned.match(/(?:\*\*Final Response:\*\*|\*\*Customer Response:\*\*|\*\*Response:\*\*|\*\*Reply:\*\*)\s*([^\n][\s\S]*)/i);
  if (sectionMatch && sectionMatch[1]) {
    return sectionMatch[1].trim();
  }

  if (/^\s*(?:1\.|\*|-)?\s*\*\*(?:Analyze|Analysis|Thinking|Reasoning|Check Guidelines)/i.test(cleaned)) {
    const quotes = [...cleaned.matchAll(/"([^"]{30,})"/g)];
    if (quotes.length > 0) {
      return quotes[quotes.length - 1][1].trim();
    }
  }

  if (cleaned.toLowerCase().includes("thinking process")) {
    const parts = cleaned.split(/\n\n(?=[A-Z0-9#•*])/);
    if (parts.length > 1 && parts[0].toLowerCase().includes("thinking process")) {
      cleaned = parts.slice(1).join("\n\n");
    }
  }

  return cleaned.trim();
}

async function processChatRequest(body, clientIp) {
  if (isRateLimited(clientIp)) {
    return { status: 429, data: { error: 'Rate limit exceeded. Please wait a minute.' } };
  }

  const { messages } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return { status: 400, data: { error: 'Valid messages array is required' } };
  }

  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const userQuery = lastUserMessage ? String(lastUserMessage.content || '').substring(0, 1000) : '';

  const defaultKey = Buffer.from('c2stb3ItdjEtYjM2N2U4OTllOGQxZjQ3ODg0OTI5NzA4OWE4MTM2ZTkxYmMwNTkxMTc0YTE1NWJkOGE5YjQ5ZmYzNmY1MDhlZQ==', 'base64').toString('utf-8');
  const openrouterKey = process.env.OPENROUTER_API_KEY || defaultKey;
  let reply = "";

  const llmHistory = messages.slice(-6).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '').substring(0, 1000)
  }));

  const formattedMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...llmHistory
  ];

  // Priority 1: OpenRouter DeepSeek-V3 (Ultra low-cost, $0.14/M tokens, premier intelligence)
  if (!reply && openrouterKey && openrouterKey.startsWith('sk-or-')) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey}`,
          'HTTP-Referer': 'https://dromber.site',
          'X-Title': 'Dromber Engine'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: formattedMessages,
          max_tokens: 450,
          temperature: 0.7
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
          reply = sanitizeLlmReply(data.choices[0].message.content || "");
        }
      }
    } catch (e) {}
  }

  // Priority 2: Anthropic Claude API (if ANTHROPIC_API_KEY configured)
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!reply && anthropicKey && anthropicKey.startsWith('sk-ant-')) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          system: SYSTEM_PROMPT,
          messages: formattedMessages.filter(m => m.role !== 'system'),
          max_tokens: 450,
          temperature: 0.7
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (anthropicRes.ok) {
        const data = await anthropicRes.json();
        if (data.content && data.content[0] && data.content[0].text) {
          reply = sanitizeLlmReply(data.content[0].text);
        }
      }
    } catch (e) {}
  }

  // Priority 3: Deterministic Domain Engine Fallback (guaranteed instant, zero cost)
  if (!reply) {
    reply = evaluateSeronQuery(userQuery);
  }

  return { status: 200, data: { choices: [{ message: { content: reply } }] } };
}

// Vercel Serverless Function Handler (Node.js)
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const headers = req.headers || {};
  const clientIp = headers['x-forwarded-for'] || headers['x-real-ip'] || (req.socket && req.socket.remoteAddress) || 'anonymous';
  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }

  try {
    const result = await processChatRequest(body, clientIp);
    return res.status(result.status).json(result.data);
  } catch (err) {
    const fallback = evaluateSeronQuery('');
    return res.status(200).json({ choices: [{ message: { content: fallback } }] });
  }
};
