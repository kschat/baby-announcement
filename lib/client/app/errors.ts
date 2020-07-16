export abstract class ClientError extends Error {
  constructor(message: string | Error = '') {
    super(typeof message !== 'string' ? message.message : message);
    (this as any).__proto__ = new.target.prototype;
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
  }
}

export class ServiceCallError extends ClientError {
  constructor(
    public readonly title: string,
    public readonly message: string
  ) {
    super(message);
  }
}
