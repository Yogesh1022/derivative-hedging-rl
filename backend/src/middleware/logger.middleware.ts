// ═══════════════════════════════════════════════════════════════
// REQUEST LOGGER MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log detailed request info
  logger.info(`→ ${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    user: req.user?.email,
  });

  // Log detailed request data in debug mode
  logger.debug(`Request Details: ${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    params: req.params,
    body: req.body,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture original json method to log response body
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    logger.debug(`Response Body: ${req.method} ${req.url}`, { body });
    return originalJson(body);
  };

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel](`← ${req.method} ${req.url} ${res.statusCode} ${duration}ms`, {
      statusCode: res.statusCode,
      duration,
      user: req.user?.email,
    });

    // Log detailed response info in debug mode
    logger.debug(`Response Details: ${req.method} ${req.url}`, {
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      headers: res.getHeaders(),
      duration,
    });
  });

  next();
};
