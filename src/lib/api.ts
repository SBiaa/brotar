import type { ApiError } from "./types";

/**
 * Cliente HTTP do front. Concentra o parse de erro num lugar só para que os
 * componentes lidem apenas com "deu certo / mensagem de erro".
 *
 * `BASE` existe para o dia em que a API sair do Next e virar um serviço Node
 * separado: basta apontar NEXT_PUBLIC_API_URL para ele.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    credentials: "include",
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = (payload as ApiError).error ?? "Não foi possível concluir";
    throw new ApiRequestError(message, response.status);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
