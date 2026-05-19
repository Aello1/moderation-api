import { Router, Request, Response, NextFunction } from 'express';
import { analyzeContext } from '../services/context.service';
import { moderateText } from '../services/moderation.service';
import prisma from '../prisma';
const router = Router();

/**
 * @openapi
 * /api/moderate:
 *   post:
 *     summary: Metni analiz et
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: "I hate you"
 *     responses:
 *       200:
 *         description: Analiz sonucu
 *       400:
 *         description: Geçersiz istek
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
 *     summary: Moderasyon geçmişini listele
 *     parameters:
 *       - in: query
 *         name: flagged
 *         schema:
 *           type: boolean
 *         description: Sadece flagged olanları getir
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [allow, warn, block]
 *         description: Action tipine göre filtrele
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
 *         description: Log listesi
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
 *     summary: Moderasyon istatistikleri
 *     responses:
 *       200:
 *         description: İstatistik özeti
 */

router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [total, flaggedCount, actionGroups] = await Promise.all([
            prisma.moderationLog.count(),
            prisma.moderationLog.count({ where: { flagged: true } }),
            prisma.moderationLog.groupBy({
                by: ['action'],
                _count: { action: true }
            })
        ]);

        const actions: Record<string, number> = {};
        for (const group of actionGroups) {
            actions[group.action] = group._count.action;
        }

        res.json({
            total,
            flagged: flaggedCount,
            flaggedRate: total > 0 ? ((flaggedCount / total) * 100).toFixed(1) + '%' : '0%',
            actions
        })
    } catch (err) {
        next(err)
    }
})

export default router;