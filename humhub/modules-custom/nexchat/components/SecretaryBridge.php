<?php

namespace humhub\modules\nexchat\components;

use humhub\modules\nexchat\models\Attachment;
use humhub\modules\nexchat\models\Conversation;
use humhub\modules\nexchat\models\GoogleAccount;
use humhub\modules\nexchat\models\Message;
use humhub\modules\user\models\User;
use Yii;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;

/**
 * Ponte da secretária no HumHub: dispara o Next, responde como o user 7 e expõe histórico.
 * Autentica pelo segredo do serviço; assume a identidade da secretária só para gravar a resposta.
 */
class SecretaryBridge
{
    private const HISTORY_LIMIT = 20;

    /**
     * Depois de uma mensagem na DM da secretária, avisa o Next e marca digitando.
     * Ignora eco da própria secretária, canal e configuração incompleta.
     */
    public static function dispatchAfterSend(Conversation $conversation, Message $message): void
    {
        if ($conversation->type !== Conversation::TYPE_DM) {
            return;
        }

        $authorId = (int) $message->user_id;
        if (KaizzenConfig::isSecretaryUser($authorId)) {
            return;
        }

        $peerId = $conversation->peerUserId($authorId);
        if ($peerId === null || !KaizzenConfig::isSecretaryUser($peerId)) {
            return;
        }

        if (KaizzenConfig::serviceSecret() === '') {
            return;
        }

        $audioFileId = self::firstAudioFileId($message);
        self::publishTyping((int) $conversation->id, true);

        self::postToNext('/api/secretary/turn', [
            'conversationId' => (int) $conversation->id,
            'messageId' => (int) $message->id,
            'userId' => $authorId,
            'content' => (string) $message->content,
            'audioFileId' => $audioFileId,
        ]);
    }

    /**
     * Grava a resposta da secretária na DM e publica no Mercure.
     * Exige o segredo; entra como o usuário da secretária e reusa o fluxo de mensagem.
     *
     * @return array<string, mixed>
     */
    public static function reply(int $conversationId, string $content): array
    {
        KaizzenConfig::requireServiceSecret();
        $trimmed = trim($content);
        if ($conversationId <= 0 || $trimmed === '') {
            throw new \yii\web\BadRequestHttpException('Resposta da secretária inválida.');
        }

        $secretary = self::requireSecretaryIdentity();
        $conversation = Conversation::findOne($conversationId);
        if (!$conversation || !$conversation->canAccess((int) $secretary->id)) {
            throw new ForbiddenHttpException('A secretária não participa desta conversa.');
        }

        Yii::$app->user->login($secretary);

        $message = new Message([
            'conversation_id' => $conversation->id,
            'user_id' => (int) $secretary->id,
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
     * Últimas mensagens da DM para o turno da secretária.
     * Exige o segredo e que a secretária seja membro da conversa.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function history(int $conversationId): array
    {
        KaizzenConfig::requireServiceSecret();
        $secretary = self::requireSecretaryIdentity();
        $conversation = Conversation::findOne($conversationId);
        if (!$conversation || !$conversation->canAccess((int) $secretary->id)) {
            throw new ForbiddenHttpException('A secretária não participa desta conversa.');
        }

        $messages = Message::find()
            ->where(['conversation_id' => $conversationId])
            ->orderBy(['id' => SORT_DESC])
            ->limit(self::HISTORY_LIMIT)
            ->all();

        $payloads = array_map(static fn(Message $message) => [
            'id' => (int) $message->id,
            'authorId' => (int) $message->user_id,
            'content' => $message->isDeleted() ? '' : (string) $message->content,
            'isSecretary' => KaizzenConfig::isSecretaryUser((int) $message->user_id),
            'audioFileId' => self::firstAudioFileId($message),
            'publishedAt' => $message->created_at,
        ], $messages);

        return array_reverse($payloads);
    }

    /**
     * Serve um anexo da DM da secretária para o Next transcrever.
     * Exige o segredo; o arquivo precisa pertencer a uma conversa da secretária.
     */
    public static function file(int $fileId): \yii\web\Response
    {
        KaizzenConfig::requireServiceSecret();
        $secretary = self::requireSecretaryIdentity();
        $attachment = Attachment::findOne($fileId);
        if (!$attachment) {
            throw new NotFoundHttpException('Arquivo não encontrado.');
        }

        $message = $attachment->message;
        if (!$message) {
            throw new NotFoundHttpException('Arquivo não encontrado.');
        }

        $conversation = Conversation::findOne((int) $message->conversation_id);
        if (!$conversation || !$conversation->canAccess((int) $secretary->id)) {
            throw new ForbiddenHttpException('A secretária não tem acesso a este arquivo.');
        }

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
     * Publica o estado de digitação da secretária no Mercure.
     */
    public static function setTyping(int $conversationId, bool $isTyping): void
    {
        KaizzenConfig::requireServiceSecret();
        $secretary = self::requireSecretaryIdentity();

        try {
            NexchatMercure::publishTyping(
                $conversationId,
                (int) $secretary->id,
                $secretary->getDisplayName(),
                $isTyping,
            );
        } catch (\Throwable $error) {
            Yii::error($error, 'nexchat');
        }
    }

    private static function requireSecretaryIdentity(): User
    {
        $userId = KaizzenConfig::secretaryUserId();
        $user = $userId > 0
            ? User::find()->active()->andWhere(['user.id' => $userId])->one()
            : null;
        if (!$user instanceof User) {
            throw new \yii\web\ServerErrorHttpException('Usuário da secretária não está configurado.');
        }

        return $user;
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
     * POST curto para o Next; o timeout só precisa entregar o corpo.
     *
     * @param array<string, mixed> $payload
     */
    private static function postToNext(string $path, array $payload): void
    {
        $url = KaizzenConfig::nextUrl() . $path;
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
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT => 8,
        ]);

        curl_exec($handle);
        $error = curl_error($handle);
        curl_close($handle);

        if ($error !== '') {
            Yii::warning('Secretária: falha ao avisar o Next — ' . $error, 'nexchat');
        }
    }

    private static function publishTyping(int $conversationId, bool $isTyping): void
    {
        $secretaryId = KaizzenConfig::secretaryUserId();
        if ($secretaryId <= 0) {
            return;
        }

        try {
            NexchatMercure::publishTyping($conversationId, $secretaryId, 'Secretária', $isTyping);
        } catch (\Throwable $error) {
            Yii::error($error, 'nexchat');
        }
    }
}
