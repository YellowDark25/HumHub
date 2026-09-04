<?php

namespace humhub\modules\nexchat\components;

use humhub\modules\nexchat\models\Attachment;
use humhub\modules\nexchat\models\Conversation;
use humhub\modules\nexchat\models\GoogleAccount;
use humhub\modules\nexchat\models\Message;
use humhub\modules\nexchat\models\SecretaryConversationState;
use humhub\modules\nexchat\models\SecretaryUserMemory;
use Yii;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;

/**
 * Ponte da secretária no HumHub: dispara o agente Python, grava a resposta e expõe histórico e memória.
 * Autentica pelo segredo do serviço; não assume outro usuário HumHub.
 */
class SecretaryBridge
{
    private const HISTORY_LIMIT_MIN = 4;
    private const HISTORY_LIMIT_MAX = 40;
    private const TYPING_ACTOR_ID = 0;

    /**
     * Depois de uma mensagem no fio da secretária, avisa o agente Python e marca digitando.
     * Ignora eco da própria secretária, canal e configuração incompleta.
     */
    public static function dispatchAfterSend(Conversation $conversation, Message $message): void
    {
        if (!$conversation->isSecretaryThread()) {
            return;
        }

        if ($message->isFromSecretary()) {
            return;
        }

        if (KaizzenConfig::serviceSecret() === '' || KaizzenConfig::agentUrl() === '') {
            return;
        }

        $audioFileId = self::firstAudioFileId($message);
        self::publishTyping((int) $conversation->id, true);

        self::postToAgent('/api/secretary/turn', [
            'conversationId' => (int) $conversation->id,
            'messageId' => (int) $message->id,
            'userId' => (int) $message->user_id,
            'content' => (string) $message->content,
            'audioFileId' => $audioFileId,
        ]);
    }

    /**
     * Grava a resposta da secretária no fio e publica no Mercure.
     * Exige o segredo; usa o user_id do dono com a flag is_secretary.
     *
     * @return array<string, mixed>
     */
    public static function reply(int $conversationId, string $content): array
    {
        KaizzenConfig::requireServiceSecret();
        Message::ensureSecretaryFlag();
        $trimmed = trim($content);
        if ($conversationId <= 0 || $trimmed === '') {
            throw new \yii\web\BadRequestHttpException('Resposta da secretária inválida.');
        }

        $conversation = self::requireSecretaryConversation($conversationId);
        $ownerId = $conversation->secretaryOwnerId();
        if ($ownerId <= 0) {
            throw new ForbiddenHttpException('A secretária não participa desta conversa.');
        }

        $message = new Message([
            'conversation_id' => $conversation->id,
            'user_id' => $ownerId,
            'is_secretary' => 1,
            'content' => $trimmed,
        ]);

        if (!$message->save()) {
            throw new \yii\web\ServerErrorHttpException('Não foi possível enviar a resposta da secretária.');
        }

        $message->refresh();
        self::publishTyping((int) $conversation->id, false);

        try {
            NexchatMercure::publishNewMessage($message);
        } catch (\Throwable $error) {
            Yii::error($error, 'nexchat');
        }

        return $message->toPayload();
    }

    /**
     * Últimas mensagens cruas do fio para complementar o resumo no prompt.
     * Exige o segredo e que a conversa seja da secretária.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function history(int $conversationId, int $limit = 0): array
    {
        KaizzenConfig::requireServiceSecret();
        self::requireSecretaryConversation($conversationId);

        $resolvedLimit = $limit > 0 ? $limit : KaizzenConfig::secretaryHistoryLimit();
        $resolvedLimit = max(self::HISTORY_LIMIT_MIN, min(self::HISTORY_LIMIT_MAX, $resolvedLimit));

        $messages = Message::find()
            ->where(['conversation_id' => $conversationId])
            ->orderBy(['id' => SORT_DESC])
            ->limit($resolvedLimit)
            ->all();

        $payloads = array_map(static fn(Message $message) => [
            'id' => (int) $message->id,
            'authorId' => (int) $message->user_id,
            'content' => $message->isDeleted() ? '' : (string) $message->content,
            'isSecretary' => $message->isFromSecretary(),
            'audioFileId' => self::firstAudioFileId($message),
            'publishedAt' => $message->created_at,
        ], $messages);

        return array_reverse($payloads);
    }

    /**
     * Serve um anexo da DM da secretária para o agente transcrever.
     * Exige o segredo; o arquivo precisa pertencer a uma conversa da secretária.
     */
    public static function file(int $fileId): \yii\web\Response
    {
        KaizzenConfig::requireServiceSecret();
        $attachment = Attachment::findOne($fileId);
        if (!$attachment) {
            throw new NotFoundHttpException('Arquivo não encontrado.');
        }

        $message = $attachment->message;
        if (!$message) {
            throw new NotFoundHttpException('Arquivo não encontrado.');
        }

        self::requireSecretaryConversation((int) $message->conversation_id);

        $path = $attachment->getFilePath();
        if (!is_file($path)) {
            throw new NotFoundHttpException('Arquivo indisponível.');
        }

        return Yii::$app->response->sendFile($path, $attachment->file_name, [
            'mimeType' => $attachment->mime ?: 'application/octet-stream',
            'inline' => true,
        ]);
    }

    /**
     * Conta Google do usuário, para o turno chamar Calendar/Tasks.
     * Exige o segredo; sem vínculo devolve null.
     *
     * @return array{userId: int, email: string, refreshToken: string, expiresAt: string|null}|null
     */
    public static function googleAccountForUser(int $userId): ?array
    {
        KaizzenConfig::requireServiceSecret();
        if ($userId <= 0) {
            return null;
        }

        GoogleAccount::ensureTable();
        $account = GoogleAccount::findOne(['user_id' => $userId]);
        if (!$account) {
            return null;
        }

        return $account->toServicePayload();
    }

    /**
     * Lê o resumo rolante da conversa da secretária.
     *
     * @return array{conversationId: int, summary: string, summarizedUpToMessageId: int, turnCount: int}
     */
    public static function conversationState(int $conversationId): array
    {
        KaizzenConfig::requireServiceSecret();
        self::requireSecretaryConversation($conversationId);

        return SecretaryConversationState::payloadFor($conversationId);
    }

    /**
     * Grava o resumo rolante depois do turno.
     *
     * @return array{conversationId: int, summary: string, summarizedUpToMessageId: int, turnCount: int}
     */
    public static function saveConversationState(
        int $conversationId,
        string $summary,
        int $summarizedUpToMessageId,
        int $turnCount,
    ): array {
        KaizzenConfig::requireServiceSecret();
        self::requireSecretaryConversation($conversationId);

        return SecretaryConversationState::upsert(
            $conversationId,
            $summary,
            $summarizedUpToMessageId,
            $turnCount,
        );
    }

    /**
     * Preferências estruturadas do usuário para o system prompt.
     *
     * @return array<int, array{key: string, value: string}>
     */
    public static function listMemory(int $userId): array
    {
        KaizzenConfig::requireServiceSecret();
        if ($userId <= 0) {
            throw new \yii\web\BadRequestHttpException('Usuário da memória inválido.');
        }

        return SecretaryUserMemory::listForUser($userId);
    }

    /**
     * Grava ou atualiza uma preferência do usuário.
     *
     * @return array{key: string, value: string}
     */
    public static function rememberMemory(int $userId, string $key, string $value): array
    {
        KaizzenConfig::requireServiceSecret();
        if ($userId <= 0) {
            throw new \yii\web\BadRequestHttpException('Usuário da memória inválido.');
        }

        $normalizedKey = SecretaryUserMemory::normalizeKey($key);
        $trimmedValue = mb_substr(trim($value), 0, SecretaryUserMemory::VALUE_MAX_LENGTH);
        if ($normalizedKey === '' || $trimmedValue === '') {
            throw new \yii\web\BadRequestHttpException('Preferência inválida.');
        }

        return SecretaryUserMemory::remember($userId, $normalizedKey, $trimmedValue);
    }

    /**
     * Apaga uma preferência do usuário. False se a chave não existia.
     */
    public static function forgetMemory(int $userId, string $key): bool
    {
        KaizzenConfig::requireServiceSecret();
        if ($userId <= 0) {
            throw new \yii\web\BadRequestHttpException('Usuário da memória inválido.');
        }

        $normalizedKey = SecretaryUserMemory::normalizeKey($key);
        if ($normalizedKey === '') {
            throw new \yii\web\BadRequestHttpException('Preferência inválida.');
        }

        return SecretaryUserMemory::forget($userId, $normalizedKey);
    }

    /**
     * Publica o estado de digitação da secretária no Mercure.
     */
    public static function setTyping(int $conversationId, bool $isTyping): void
    {
        KaizzenConfig::requireServiceSecret();
        self::requireSecretaryConversation($conversationId);

        try {
            NexchatMercure::publishTyping(
                $conversationId,
                self::TYPING_ACTOR_ID,
                'Secretária',
                $isTyping,
            );
        } catch (\Throwable $error) {
            Yii::error($error, 'nexchat');
        }
    }

    /**
     * Exige que o id seja um fio da secretária.
     */
    private static function requireSecretaryConversation(int $conversationId): Conversation
    {
        $conversation = Conversation::findOne($conversationId);
        if (!$conversation || !$conversation->isSecretaryThread()) {
            throw new ForbiddenHttpException('A secretária não participa desta conversa.');
        }

        return $conversation;
    }

    private static function firstAudioFileId(Message $message): ?int
    {
        foreach ($message->attachments as $attachment) {
            $mime = (string) $attachment->mime;
            $name = strtolower((string) $attachment->file_name);
            if (str_starts_with($mime, 'audio/') || preg_match('/\.(webm|ogg|mp3|wav|m4a)$/', $name)) {
                return (int) $attachment->id;
            }
        }

        return null;
    }

    /**
     * POST curto para o agente Python; o timeout só precisa entregar o corpo.
     *
     * @param array<string, mixed> $payload
     */
    private static function postToAgent(string $path, array $payload): void
    {
        $url = KaizzenConfig::agentUrl() . $path;
        $secret = KaizzenConfig::serviceSecret();
        $body = json_encode($payload);
        if ($body === false) {
            return;
        }

        $handle = curl_init($url);
        if ($handle === false) {
            return;
        }

        curl_setopt_array($handle, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json',
                KaizzenConfig::SECRET_HEADER . ': ' . $secret,
                'Authorization: Bearer ' . $secret,
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT => 15,
        ]);

        $raw = curl_exec($handle);
        $status = (int) curl_getinfo($handle, CURLINFO_HTTP_CODE);
        $error = curl_error($handle);
        curl_close($handle);

        if ($error !== '') {
            Yii::warning('Secretária: falha ao avisar o agente — ' . $error, 'nexchat');
            return;
        }

        if ($status < 200 || $status >= 300) {
            $snippet = is_string($raw) ? substr($raw, 0, 180) : '';
            Yii::warning(
                'Secretária: agente respondeu ' . $status . ' em ' . $url . ($snippet !== '' ? ' — ' . $snippet : ''),
                'nexchat',
            );
        }
    }

    /**
     * Liga ou desliga o indicador de digitação da secretária no Mercure.
     */
    private static function publishTyping(int $conversationId, bool $isTyping): void
    {
        try {
            NexchatMercure::publishTyping(
                $conversationId,
                self::TYPING_ACTOR_ID,
                'Secretária',
                $isTyping,
            );
        } catch (\Throwable $error) {
            Yii::error($error, 'nexchat');
        }
    }
}
