// Type declarations for modules without TypeScript definitions
import { AuthUser } from '../services/supabaseService';

declare module 'express' {
  import { IncomingMessage, ServerResponse } from 'http';
  
  export interface Request extends IncomingMessage {
    body: any;
    params: Record<string, string>;
    query: Record<string, string>;
    ip: string;
    path: string;
    method: string;
    user?: AuthUser;
  }
  
  export interface Response extends ServerResponse {
    status(code: number): Response;
    json(body: any): Response;
    send(body: any): Response;
    sendFile(path: string): void;
    setHeader(name: string, value: string | number): Response;
  }
  
  export interface NextFunction {
    (err?: any): void;
  }
  
  export interface Express {
    use(handler: (err: any, req: Request, res: Response, next: NextFunction) => void): Express;
    use(...handlers: any[]): Express;
    get(path: string, ...handlers: any[]): Express;
    post(path: string, ...handlers: any[]): Express;
    put(path: string, ...handlers: any[]): Express;
    delete(path: string, ...handlers: any[]): Express;
    listen(port: number | string, callback?: () => void): any;
  }
  
  export interface Router {
    use(...handlers: any[]): Router;
    get(path: string, ...handlers: any[]): Router;
    post(path: string, ...handlers: any[]): Router;
    put(path: string, ...handlers: any[]): Router;
    delete(path: string, ...handlers: any[]): Router;
  }
  
  export function json(options?: {limit?: string}): any;
  export function urlencoded(options?: {extended?: boolean, limit?: string}): any;
  export function static(path: string): any;
  
  export default function express(): Express;
  export function Router(): Router;
}

declare module 'cors' {
  import { Request, Response, NextFunction } from 'express';
  
  interface CorsOptions {
    origin?: string | string[] | boolean | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
  }
  
  function cors(options?: CorsOptions): (req: Request, res: Response, next: NextFunction) => void;
  export default cors;
}

declare module 'helmet' {
  import { Request, Response, NextFunction } from 'express';
  
  interface HelmetOptions {
    contentSecurityPolicy?: boolean | object;
    [key: string]: any;
  }
  
  function helmet(options?: HelmetOptions): (req: Request, res: Response, next: NextFunction) => void;
  export default helmet;
}

declare module 'express-rate-limit' {
  import { Request, Response, NextFunction } from 'express';
  
  interface RateLimitOptions {
    windowMs?: number;
    max?: number;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
    message?: string | object;
  }
  
  function rateLimit(options?: RateLimitOptions): (req: Request, res: Response, next: NextFunction) => void;
  export default rateLimit;
}

declare module 'express-validator' {
  import { Request, Response, NextFunction } from 'express';
  
  export function check(field: string): any;
  export function validationResult(req: Request): {
    isEmpty(): boolean;
    array(): Array<{msg: string}>;
  };
}
