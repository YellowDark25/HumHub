import { ApplicationError } from "@/application/errors";
import type { SpeechToTextRepository } from "@/application/ports/SpeechToTextRepository";
import { getGeminiApiKey, getOpenAiApiKey } from "../config";

/**
 * Transcreve recados de áudio: Gemini primeiro, Whisper se só a OpenAI estiver no env.
 * Uma chamada por recado; devolve o texto falado.
 */
export class GeminiSpeechToTextRepository implements SpeechToTextRepository {
  /**
   * Diz se há Gemini ou OpenAI para transcrever.
   */
  isConfigured(): boolean {
    return Boolean(getGeminiApiKey() || getOpenAiApiKey());
  }

  /**
   * Transcreve o anexo. Prefere Gemini Flash; senão Whisper.
   */
  async transcribe(input: {
    body: ArrayBuffer;
    mimeType: string;
    fileName: string;
  }): Promise<string> {
    if (getGeminiApiKey()) {
      return transcribeWithGemini(input);
    }

    return transcribeWithWhisper(input);
  }
}

async function transcribeWithGemini(input: {
  body: ArrayBuffer;
  mimeType: string;
}): Promise<string> {
  const mime = input.mimeType || "audio/webm";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${getGeminiApiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Transcreva o áudio em português do Brasil. Devolva só o texto falado.",
              },
              {
                inlineData: {
                  mimeType: mime,
                  data: Buffer.from(input.body).toString("base64"),
                },
              },
            ],
          },
        ],
      }),
    },
  );
  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new ApplicationError(
      data.error?.message || "Não foi possível transcrever o áudio.",
      502,
    );
  }

  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

async function transcribeWithWhisper(input: {
  body: ArrayBuffer;
  mimeType: string;
  fileName: string;
}): Promise<string> {
  const form = new FormData();
  form.set(
    "file",
    new Blob([input.body], { type: input.mimeType || "audio/webm" }),
    input.fileName || "audio.webm",
  );
  form.set("model", "whisper-1");
  form.set("language", "pt");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${getOpenAiApiKey()}` },
    body: form,
  });
  const data = (await response.json()) as { text?: string; error?: { message?: string } };
  if (!response.ok) {
    throw new ApplicationError(
      data.error?.message || "Não foi possível transcrever o áudio.",
      502,
    );
  }

  return data.text?.trim() ?? "";
}
