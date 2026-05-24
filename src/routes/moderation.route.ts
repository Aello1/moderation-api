import { Router, Request, Response, NextFunction } from 'express';
import { analyzeContext } from '../services/context.service';
import { moderateText } from '../services/moderation.service';
import prisma from '../prisma';
const router = Router();

/**
 * @openapi
 * /api/moderate:
 *   post:
 *     summary: Analyze text or conversation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 properties:
 *                   mode:
 *                     type: string
 *                     enum: [single]
 *                   text:
 *                     type: string
 *                     example: "I hate you"
 *               - type: object
 *                 properties:
 *                   mode:
 *                     type: string
 *                     enum: [context]
 *                   messages:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         username:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [user, assistant]
 *                         content:
 *                           type: string
 *     responses:
 *       200:
 *         description: Analysis result
 *       400:
 *         description: Invalid request
 */

router.post('/moderate', async (req: Request, res: Response, next: NextFunction) => {
    const { mode, text, messages } = req.body;

    try {
        if (mode === 'context') {
            if (!messages || !Array.isArray(messages) || messages.length === 0) {
                res.status(400).json({ error: 'messages alanı zorunludur ve dizi olmalıdır.' });
                return;
            }

            const result = await analyzeContext(messages);
            res.json(result);
            return;
        }

        // single mod (varsayılan)
        if (!text) {
            res.status(400).json({ error: 'text alanı zorunludur.' });
            return;
        }

        if (typeof text !== 'string') {
            res.status(400).json({ error: 'text string olmalıdır.' });
            return;
        }

        if (text.length > 5000) {
            res.status(400).json({ error: 'text 5000 karakterden uzun olamaz.' });
            return;
        }

        if (text.trim().length === 0) {
            res.status(400).json({ error: 'text boş olamaz.' });
            return;
        }

        const result = await moderateText(text);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

/**
 * @openapi
 * /api/logs:
 *   get:
 *     summary: List moderation history
 *     parameters:
 *       - in: query
 *         name: flagged
 *         schema:
 *           type: boolean
 *         description: Return only flagged entries
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [allow, warn, block]
 *         description: Filter by action type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Log list
 */

router.get('/logs', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { flagged, action, page = '1', limit = '10' } = req.query;
        const where: any = {};

        if (flagged !== undefined) {
            where.flagged = flagged === 'true';
        }

        if (action !== undefined) {
            where.action = action;
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const [logs, total] = await Promise.all([
            prisma.moderationLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.moderationLog.count({ where })
        ]);

        res.json({
            data: logs,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });

    } catch (err) {
        next(err);
    }
})

/**
 * @openapi
 * /api/stats:
 *   get:
 *     summary: Moderation statistics
 *     responses:
 *       200:
 *         description: Statistics summary
 */

router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [
            singleTotal,
            singleFlagged,
            singleActionGroups,
            contextTotal,
            contextFlagged,
            contextActionGroups,
        ] = await Promise.all([
            prisma.moderationLog.count(),
            prisma.moderationLog.count({ where: { flagged: true } }),
            prisma.moderationLog.groupBy({ by: ['action'], _count: { action: true } }),
            prisma.contextLog.count(),
            prisma.contextLog.count({ where: { flagged: true } }),
            prisma.contextLog.groupBy({ by: ['action'], _count: { action: true } }),
        ]);

        const toActionMap = (groups: { action: string, _count: { action: number } }[]) => {
            const map: Record<string, number> = {};
            for (const g of groups) map[g.action] = g._count.action;
            return map;
        };

        const total = singleTotal + contextTotal;
        const flagged = singleFlagged + contextFlagged;

        res.json({
            total,
            flagged,
            flaggedRate: total > 0 ? ((flagged / total) * 100).toFixed(1) + '%' : '0%',
            single: {
                total: singleTotal,
                flagged: singleFlagged,
                actions: toActionMap(singleActionGroups)
            },
            context: {
                total: contextTotal,
                flagged: contextFlagged,
                actions: toActionMap(contextActionGroups)
            }
        })

    } catch (err) {
        next(err)
    }
})

/**
 * @openapi
 * /api/context-logs:
 *   get:
 *     summary: Bağlam analizi geçmişini listele
 *     parameters:
 *       - in: query
 *         name: flagged
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [allow, warn, block]
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Context log listesi
 */

router.get('/context-logs', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { flagged, action, provider, page = '1', limit = '10' } = req.query;

        const where: any = {};

        if (flagged !== undefined) {
            where.flagged = flagged === 'true';
        }
        if (action !== undefined) {
            where.action = action;
        }

        if (provider !== undefined) {
            where.provider = provider;
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const [logs, total] = await Promise.all([
            prisma.contextLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.contextLog.count({ where })
        ]);

        res.json({
            data: logs,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        next(err);
    }
})
export default router;