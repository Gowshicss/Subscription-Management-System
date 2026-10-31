import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[Error]', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const isProd = process.env.NODE_ENV === 'production';
  const message = statusCode === 500 && isProd
    ? 'An unexpected internal server error occurred. Please try again later.'
    : (err.message || 'An unexpected internal error occurred.');

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

