import { Request, Response } from 'express';
import app from './app';

/**
 * Google Cloud Functions entry point
 * This function handles all HTTP requests and routes them through the Express app
 */
export const avyraEdaiApi = async (req: Request, res: Response): Promise<void> => {
  // Set CORS headers for Cloud Functions
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Route the request through the Express app
  app(req, res);
};

/**
 * Alternative function name for different deployment scenarios
 */
export const api = avyraEdaiApi;
