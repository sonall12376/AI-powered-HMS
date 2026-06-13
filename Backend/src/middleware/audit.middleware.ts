import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  // Capture request information
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const method = req.method;
  const path = req.originalUrl;
  
  // Intercept the response finish event
  res.on('finish', async () => {
    const status = res.statusCode;
    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    const isUnauthorized = status === 401 || status === 403;
    
    // We only log state mutations and unauthorized/forbidden attempts
    if (isMutation || isUnauthorized) {
      const userId = req.user?.userId || null;
      const action = `${isUnauthorized ? 'UNAUTHORIZED_ATTEMPT' : 'MUTATION'}: ${method} ${path}`;
      
      // Sanitize request body to prevent logging sensitive details like raw passwords in plain text
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = '***';
      if (sanitizedBody.passwordHash) sanitizedBody.passwordHash = '***';
      if (sanitizedBody.tempPassword) sanitizedBody.tempPassword = '***';

      const changes = {
        method,
        path,
        statusCode: status,
        payload: sanitizedBody,
        query: req.query
      };

      try {
        await prisma.auditLog.create({
          data: {
            userId,
            action,
            ipAddress,
            changes: JSON.stringify(changes)
          }
        });
      } catch (err) {
        // Fallback to console to prevent blocking server execution if logging fails
        console.error('Failed to write audit log to database:', err);
      }
    }
  });

  next();
};
