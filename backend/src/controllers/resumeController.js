import { asyncHandler } from '../middlewares/asyncHandler.js';
import { generateStructured } from '../services/geminiService.js';
import { logSystemAction } from '../utils/logger.js';
import ApiError from '../utils/ApiError.js';
import { MAX_PDF_BYTES, MAX_RESUME_TEXT_CHARS } from '../config/resumeConstants.js';

/* ─── Gemini schema ───────────────────────────────────────────────────────── */
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

const SYSTEM_INSTRUCTION = `You are an expert resume parsing AI. Analyze the provided resume text and extract structured information.
Be conservative and accurate — if information is not present, return null or an empty array. Do NOT hallucinate or invent details.
For experience_years: calculate total professional work experience in years as a number. Return 0 if unclear.
For skills: extract all technical and professional skills. Return an empty array if none found.
For education: extract each degree/certification. Return an empty array if none found.
For summary: write a concise 2-3 sentence professional summary based on the resume content.
For scores: objectively grade the candidate on a scale of 0 to 100 for skills, experience, projects, and overall strength compared to industry standards.
For email and phone: extract them if present, otherwise return null.
Output ONLY valid JSON matching the schema.`;

/* ─── File Upload Handler ─────────────────────────────────────────────────── */
export const analyzeResume = asyncHandler(async (req, res) => {
  // multer attaches the file to req.file
  if (!req.file) {
    throw new ApiError(400, 'No PDF file uploaded. Please select a PDF file.');
  }

  const pdfBuffer = req.file.buffer;

  // Validate size (multer limits handle this too, but double-check)
  if (pdfBuffer.byteLength > MAX_PDF_BYTES) {
    throw new ApiError(400, `PDF is too large. Maximum allowed size is ${MAX_PDF_BYTES / 1024 / 1024} MB.`);
  }

  // Validate MIME type
  const mimeType = req.file.mimetype || '';
  if (!mimeType.includes('pdf')) {
    throw new ApiError(400, 'Only PDF files are supported. Please upload a valid .pdf file.');
  }

  // Gemini structured extraction with multimodal PDF support
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
  } catch {
    throw new ApiError(502, 'AI analysis failed. Please try again in a moment.');
  }

  // Construct final sanitized object
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

  await logSystemAction({
    action:      'RESUME_ANALYZE',
    status:      'success',
    message:     `Resume analyzed: ${candidate.name || 'Unknown'} (${req.file.originalname})`,
    metadata:    { filename: req.file.originalname, size_bytes: pdfBuffer.byteLength, skills_count: candidate.skills.length },
    triggeredBy: req.session?.userId || null,
    orgId:       req.session?.orgId  || null,
  });

  res.status(200).json({ success: true, candidate });
});
