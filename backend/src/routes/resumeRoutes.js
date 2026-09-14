import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { analyzeResume } from '../controllers/resumeController.js';
import { MAX_PDF_BYTES } from '../config/resumeConstants.js';

const router = express.Router();

// Store PDF in memory (no disk writes) — max 10 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PDF_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed.'), false);
    }
  },
});

router.use(requireAuth);

router.post('/analyze', upload.single('resume'), analyzeResume);

export default router;
