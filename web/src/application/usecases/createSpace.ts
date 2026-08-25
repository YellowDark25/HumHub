import type { CreateSpaceInput, SpaceVisibility } from "@/domain/Space";
import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import type { ChatRepository } from "../ports/ChatRepository";
import type { SpaceRepository } from "../ports/SpaceRepository";
import { enableSpaceServer } from "./enableSpaceServer";
import { getCurrentUser } from "./getCurrentUser";

const MIN_SPACE_NAME_LENGTH = 2;
const MAX_SPACE_NAME_LENGTH = 45;
const MAX_SPACE_DESCRIPTION_LENGTH = 100;

export async function createSpace(
  auth: AuthRepository,
  spaces: SpaceRepository,
  chat: ChatRepository,
  token: string,
  input: CreateSpaceInput & { createServer: boolean },
) {
  await requireSpaceAdmin(auth, token);
  const space = await spaces.create(token, {
    name: readSpaceName(input.name),
    description: readSpaceDescription(input.description),
    visibility: readSpaceVisibility(input.visibility),
  });
  const joined = await spaces.follow(token, space.id);

  if (input.createServer) {
    await enableSpaceServer(chat, token, joined.id);
  }

  return joined;
}

async function requireSpaceAdmin(auth: AuthRepository, token: string) {
  const user = await getCurrentUser(auth, token);
  if (!user.isAdmin) {
    throw new ApplicationError(
      "Apenas administradores podem criar espaços.",
      403,
    );
  }
}

function readSpaceName(name: string) {
  const trimmed = name.trim();
  if (trimmed.length < MIN_SPACE_NAME_LENGTH) {
    throw new ApplicationError(
      "O nome do espaço deve ter pelo menos 2 caracteres.",
      400,
    );
  }

  if (trimmed.length > MAX_SPACE_NAME_LENGTH) {
    throw new ApplicationError(
      "O nome do espaço pode ter no máximo 45 caracteres.",
      400,
    );
  }

  return trimmed;
}

function readSpaceDescription(description: string) {
  const trimmed = description.trim();
  if (trimmed.length > MAX_SPACE_DESCRIPTION_LENGTH) {
    throw new ApplicationError(
      "A descrição do espaço pode ter no máximo 100 caracteres.",
      400,
    );
  }

  return trimmed;
}

function readSpaceVisibility(visibility: SpaceVisibility) {
  if (visibility === "public" || visibility === "private") {
    return visibility;
  }

  throw new ApplicationError("Escolha se o espaço é público ou privado.", 400);
}
