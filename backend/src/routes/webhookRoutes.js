import { Router } from 'express';
import { handleWebhook } from '../controllers/webhookController.js';

const router = Router();

/**
 * @swagger
 * /api/webhooks/{id}:
 *   post:
 *     summary: Trigger a workflow via webhook
 *     tags: [Webhooks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The workflow ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       202:
 *         description: Workflow triggered successfully
 */
router.post('/:id', handleWebhook);

export default router;
