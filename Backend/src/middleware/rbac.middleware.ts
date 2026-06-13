import { Request, Response, NextFunction } from 'express';

export const authorize = (allowedRoles: ('SUPER_ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PATIENT' | 'LAB_TECH' | 'PHARMACIST')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required. Fail-closed.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden: Insufficient permissions.' });
    }

    next();
  };
};
