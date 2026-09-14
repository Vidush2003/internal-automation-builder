/**
 * Shared constants for the resume analysis pipeline.
 * Import from here — do NOT redeclare these in individual files.
 */

/** Maximum PDF file size accepted by the upload endpoint and the workflow node. */
export const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

/** Maximum characters of extracted PDF text sent to Gemini.
 *  Keeps the prompt within safe token limits for gemini-flash. */
export const MAX_RESUME_TEXT_CHARS = 8_000;

/** Timeout in ms for outbound PDF fetches (workflow node only). */
export const PDF_FETCH_TIMEOUT_MS = 15_000;
