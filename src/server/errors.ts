/** Erros de domínio. A camada HTTP traduz cada um num status. */

export class ValidationError extends Error {
  readonly status = 400;
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = "Você precisa entrar para continuar") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends Error {
  readonly status = 404;
  constructor(message = "Não encontrado") {
    super(message);
    this.name = "NotFoundError";
  }
}
