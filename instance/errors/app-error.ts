export type AppErrorParams = {
    code: string;
    message: string;
    statusCode: number;
    param?: string;
  };
  
  export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly param?: string;
  
    constructor({ code, message, statusCode, param }: AppErrorParams) {
      super(message);
  
      this.statusCode = statusCode;
      this.code = code;
      this.param = param;
      this.name = 'AppError';
      Object.setPrototypeOf(this, new.target.prototype); // fix prototype chain
    }
  }