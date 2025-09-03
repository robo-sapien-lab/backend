import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email?: string;
                role?: string;
            };
        }
    }
}
export declare const authenticateJWT: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateOwnership: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map