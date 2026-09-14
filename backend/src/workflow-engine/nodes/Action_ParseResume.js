import dns from 'dns/promises';
import { interpolateString } from '../../utils/interpolation.js';
import { generateStructured } from '../../services/geminiService.js';
import { logSystemAction } from '../../utils/logger.js';
import { MAX_PDF_BYTES, MAX_RESUME_TEXT_CHARS, PDF_FETCH_TIMEOUT_MS } from '../../config/resumeConstants.js';
/* ─── Shared SSRF guard (mirrors resumeController.js) ───────────────────── */
const isPrivateIP = (ip) => {
  if (ip === '::1' || ip === '127.0.0.1') return true;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  const [a, b] = parts.map(Number);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || a === 127;
};

const CANDIDATE_SCHEMA = {
  type: 'object',
  properties: {
    name:             { type: 'string'  },
    email:            { type: 'string'  },
    phone:            { type: 'string'  },
    skills:           { type: 'array', items: { type: 'string' } },
    experience_years: { type: 'number' },
    education: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          degree:      { type: 'string' },
          institution: { type: 'string' },
          year:        { type: 'string' },
        },
      },
    },
    summary: { type: 'string' },
    scores: {
      type: 'object',
      properties: {
        skills: { type: 'number', description: 'Score out of 100 based on breadth, depth, and relevance of technical and professional skills.' },
        experience: { type: 'number', description: 'Score out of 100 based on years of experience, seniority, and impact.' },
        projects: { type: 'number', description: 'Score out of 100 based on complexity, scale, and relevance of projects or achievements.' },
        overall: { type: 'number', description: 'Overall weighted score out of 100 representing candidate strength.' }
      },
      required: ['skills', 'experience', 'projects', 'overall']
    }
  },
  required: ['name', 'skills', 'experience_years', 'education', 'summary', 'scores'],
};

const SYSTEM_INSTRUCTION = `You are an expert resume parsing AI. Extract structured information from resume text.
Be conservative — if information is absent, return null or empty array. Do NOT hallucinate.
For experience_years: total professional experience in years as a number (0 if unclear).
For summary: a concise 2-3 sentence professional summary.
For scores: objectively grade the candidate on a scale of 0 to 100 for skills, experience, projects, and overall strength compared to industry standards.
For email and phone: extract them if present, otherwise return null.
Output ONLY valid JSON matching the schema.`;

export const execute = async (node, ctx) => {
  let { pdfUrl } = node.data;

  // Support variable interpolation e.g. {{trigger.payload.resume_url}}
  pdfUrl = interpolateString(pdfUrl || '', ctx);

  if (!pdfUrl || !pdfUrl.trim()) {
    throw new Error('Parse Resume: No PDF URL provided.');
  }

  // Validate URL
  let parsed;
  try { parsed = new URL(pdfUrl.trim()); } catch {
    throw new Error('Parse Resume: Invalid URL format.');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Parse Resume: Only HTTPS URLs are allowed.');
  }

  // SSRF check
  let address;
  try {
    ({ address } = await dns.lookup(parsed.hostname));
  } catch {
    throw new Error('Parse Resume: Could not resolve hostname.');
  }
  if (isPrivateIP(address)) {
    throw new Error('Parse Resume: Requests to internal network addresses are blocked.');
  }

  // Fetch PDF
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), PDF_FETCH_TIMEOUT_MS);
  let pdfBuffer;
  try {
    const response = await fetch(parsed.href, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'AutomataX-ResumeNode/1.0' },
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const ab = await response.arrayBuffer();
    if (ab.byteLength > MAX_PDF_BYTES) throw new Error('PDF exceeds 10 MB size limit.');
    pdfBuffer = Buffer.from(ab);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('Parse Resume: PDF fetch timed out.');
    throw new Error(`Parse Resume: Failed to fetch PDF — ${err.message}`);
  }

  // Gemini extraction with multimodal PDF support
  const prompt = [
    "Analyze this resume and extract the requested information. The resume is provided as a PDF document.",
    {
      inlineData: {
        data: pdfBuffer.toString("base64"),
        mimeType: "application/pdf"
      }
    }
  ];

  let aiResult;
  try {
    aiResult = await generateStructured(prompt, CANDIDATE_SCHEMA, SYSTEM_INSTRUCTION);
  } catch (err) {
    throw new Error(`Parse Resume: AI extraction failed — ${err.message}`);
  }

  // Final object
  const candidate = {
    name:             aiResult.name             || null,
    email:            aiResult.email            || null,
    phone:            aiResult.phone            || null,
    skills:           Array.isArray(aiResult.skills) ? aiResult.skills : [],
    experience_years: typeof aiResult.experience_years === 'number' ? aiResult.experience_years : 0,
    education:        Array.isArray(aiResult.education) ? aiResult.education : [],
    summary:          aiResult.summary          || null,
    scores:           aiResult.scores           || { skills: 0, experience: 0, projects: 0, overall: 0 },
  };

  // Log
  if (ctx?.executionId) {
    logSystemAction({
      action:   'ACTION_PARSE_RESUME',
      status:   'success',
      message:  `Parse Resume node extracted data for: ${candidate.name || 'Unknown'}`,
      metadata: { executionId: ctx.executionId, pdf_url: parsed.href, skills_count: candidate.skills.length },
    });
  }

  // Return as { candidate: {...} } so downstream nodes access via {{node_id.candidate.name}}
  return { candidate };
};
