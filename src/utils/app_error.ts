export default class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  no_client?: boolean;

  constructor(message: string, statusCode: number, no_client?: boolean) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${this.statusCode}`.startsWith("4") ? "FAIL" : "ERROR";
    this.isOperational = true;
    this.no_client = no_client;
    Error.captureStackTrace(this, this.constructor);
  }
}
