import { Request, Response } from 'express';
import { AnalyticsEvent } from '../models';
import { Op } from 'sequelize';
import crypto from 'crypto';

// Hash IP for privacy (no raw IP stored)
function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'] as string | undefined;
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export async function trackEvent(req: Request, res: Response) {
  try {
    const { path, sessionId, referrer } = req.body;
    if (!path || !sessionId) {
      return res.status(400).json({ error: 'path and sessionId required' });
    }
    const ipHash = hashIp(getClientIp(req));
    const userAgent = (req.headers['user-agent'] || '').slice(0, 1024);
    const userId = (req as any).user?.id || null;

    await AnalyticsEvent.create({
      path: String(path).slice(0, 1024),
      sessionId: String(sessionId).slice(0, 128),
      ipHash,
      userAgent,
      referrer: referrer ? String(referrer).slice(0, 1024) : null,
      userId,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('trackEvent error:', err);
    res.status(500).json({ error: 'internal error' });
  }
}

export async function getStats(req: Request, res: Response) {
  try {
    const daysParam = parseInt(String(req.query.days || '30'), 10);
    const days = Math.max(1, Math.min(365, daysParam));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const events = await AnalyticsEvent.findAll({
      where: { createdAt: { [Op.gte]: since } },
      attributes: ['id', 'path', 'sessionId', 'ipHash', 'createdAt', 'referrer', 'userAgent'],
      order: [['createdAt', 'DESC']],
    });

    // Total page views
    const totalVisits = events.length;

    // Unique visitors (by sessionId)
    const uniqueSessions = new Set(events.map((e) => e.sessionId)).size;

    // Unique by IP hash
    const uniqueIps = new Set(events.map((e) => e.ipHash)).size;

    // Today's visits
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayVisits = events.filter((e) => new Date(e.createdAt) >= startOfToday).length;

    // Yesterday's visits
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const yesterdayVisits = events.filter(
      (e) => new Date(e.createdAt) >= startOfYesterday && new Date(e.createdAt) < startOfToday
    ).length;

    // Visits by day
    const byDay: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = 0;
    }
    events.forEach((e) => {
      const key = new Date(e.createdAt).toISOString().slice(0, 10);
      if (key in byDay) byDay[key]++;
    });

    // Top pages
    const pathCount: Record<string, number> = {};
    events.forEach((e) => {
      pathCount[e.path] = (pathCount[e.path] || 0) + 1;
    });
    const topPages = Object.entries(pathCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([path, count]) => ({ path, count }));

    // Top referrers
    const refCount: Record<string, number> = {};
    events.forEach((e) => {
      const r = e.referrer || '(direct)';
      refCount[r] = (refCount[r] || 0) + 1;
    });
    const topReferrers = Object.entries(refCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([referrer, count]) => ({ referrer, count }));

    // Recent events (last 50)
    const recent = events.slice(0, 50).map((e) => ({
      path: e.path,
      sessionId: e.sessionId.slice(0, 8),
      createdAt: e.createdAt,
    }));

    res.json({
      totalVisits,
      uniqueSessions,
      uniqueIps,
      todayVisits,
      yesterdayVisits,
      byDay,
      topPages,
      topReferrers,
      recent,
      days,
    });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ error: 'internal error' });
  }
}
