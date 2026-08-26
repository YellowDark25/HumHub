export function readHumhubErrorMessage(
  payload: unknown,
  status: number,
): string {
  if (!payload || typeof payload !== "object") {
    return `HumHub retornou ${status}`;
  }

  const record = payload as Record<string, unknown>;
  const fieldMessages = collectValidationMessages(record);
  if (fieldMessages.length > 0) {
    return fieldMessages.map(translateHumhubMessage).join(" ");
  }

  if (typeof record.gate === "string" && record.gate.includes("password")) {
    return "Esta conta precisa definir uma senha nova no primeiro acesso.";
  }

  if (typeof record.message === "string" && record.message) {
    return translateHumhubMessage(record.message);
  }

  return `HumHub retornou ${status}`;
}

function collectValidationMessages(payload: Record<string, unknown>): string[] {
  const messages: string[] = [];
  for (const key of ["account", "profile", "password", "errors"]) {
    collectStrings(payload[key], messages);
  }

  return [...new Set(messages)];
}

function collectStrings(value: unknown, messages: string[]) {
  if (typeof value === "string" && value.trim()) {
    messages.push(value.trim());
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, messages);
    }
    return;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      collectStrings(item, messages);
    }
  }
}

function translateHumhubMessage(message: string): string {
  if (message === "Validation failed") {
    return "Os dados não passaram na validação.";
  }

  if (/username contains invalid characters/i.test(message)) {
    return "O nome de usuário contém caracteres inválidos. Use letras, números, ponto, hífen ou underline, sem espaços.";
  }

  if (/has already been taken/i.test(message)) {
    if (/email/i.test(message)) {
      return "Este e-mail já está em uso.";
    }

    if (/username/i.test(message)) {
      return "Este nome de usuário já está em uso.";
    }

    return "Este valor já está em uso.";
  }

  if (/you cannot use this username/i.test(message)) {
    return "Este nome de usuário não é permitido.";
  }

  return message;
}
