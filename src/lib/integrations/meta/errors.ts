export type ParsedMetaError = {
  code: string;
  message: string;
  shouldInvalidateCredential: boolean;
  shouldRetry: boolean;
};

export function parseMetaError(err: unknown): ParsedMetaError {
  const message = err instanceof Error ? err.message : String(err);
  const codeMatch = message.match(/\(#\d+\)/);
  const code = codeMatch?.[0] ?? "(#unknown)";

  const shouldInvalidateCredential = ["(#200)", "(#190)"].includes(code);
  const shouldRetry = ["(#4)", "(#10)", "(#429)"].includes(code);

  return {
    code,
    message,
    shouldInvalidateCredential,
    shouldRetry,
  };
}

export class MetaApiError extends Error {
  constructor(
    message: string,
    public readonly parsed: ParsedMetaError,
  ) {
    super(message);
    this.name = "MetaApiError";
  }
}
