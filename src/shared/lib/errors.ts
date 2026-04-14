export class AppError extends Error {
  public readonly context: string;
  public readonly cause: unknown;

  constructor(message: string, context: string, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.context = context;
    this.cause = cause;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context: string, cause?: unknown) {
    super(message, context, cause);
    this.name = 'ValidationError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
}

export function handleError(error: unknown, context: string): void {
  const message = getErrorMessage(error);

  console.error(`[${context}]`, message, error);
}
