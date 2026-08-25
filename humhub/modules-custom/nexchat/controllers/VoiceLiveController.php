<?php

namespace humhub\modules\nexchat\controllers;

use humhub\components\Controller;
use humhub\modules\nexchat\components\BearerLogin;
use humhub\modules\nexchat\components\NexchatMercure;
use humhub\modules\nexchat\models\Conversation;
use humhub\modules\nexchat\models\Membership;
use humhub\modules\space\models\Membership as SpaceMembership;
use Yii;
use yii\web\Response;

class VoiceLiveController extends Controller
{
    public $enableCsrfValidation = false;

    public $layout = false;

    public function beforeAction($action)
    {
        BearerLogin::authenticate();
        if (BearerLogin::hasBearer()) {
            $this->enableCsrfValidation = false;
        }

        Yii::$app->response->format = Response::FORMAT_JSON;

        return parent::beforeAction($action);
    }

    public function actionIndex()
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        $config = NexchatMercure::createVoiceSubscriberToken((int) Yii::$app->user->id);
        if (empty($config)) {
            return ['available' => false];
        }

        return $config;
    }

    public function actionPublish()
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        $body = Yii::$app->request->getBodyParams();
        $conversation = $this->loadAccessibleConversation((int) ($body['conversationId'] ?? 0));
        if (!($conversation instanceof Conversation)) {
            return $conversation;
        }

        $payload = $this->occupancyPayload($conversation, $body);
        if ($payload === null) {
            return $this->fail(400, 'Ocupação de voz inválida.');
        }

        try {
            NexchatMercure::publishVoiceOccupancy(
                $this->recipientUserIds($conversation),
                $payload,
            );
        } catch (\Throwable $error) {
            Yii::warning($error->getMessage(), 'nexchat');
        }

        return ['ok' => true];
    }

    private function loadAccessibleConversation(int $conversationId)
    {
        if ($conversationId <= 0) {
            return $this->fail(400, 'Conversa inválida.');
        }

        $conversation = Conversation::findOne($conversationId);
        if (!$conversation) {
            return $this->fail(404, 'Conversa não encontrada.');
        }

        if (!$conversation->canAccess((int) Yii::$app->user->id)) {
            return $this->fail(403, 'Você não participa desta conversa.');
        }

        return $conversation;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function occupancyPayload(Conversation $conversation, array $body): ?array
    {
        $kind = $body['kind'] ?? '';
        $name = trim((string) ($body['name'] ?? ''));
        if ($kind !== 'dm' && $kind !== 'channel') {
            return null;
        }

        $participants = [];
        foreach ($body['participants'] ?? [] as $item) {
            $participant = $this->readParticipant($item);
            if ($participant) {
                $participants[] = $participant;
            }
        }

        return [
            'type' => 'nexchat.voiceOccupancy',
            'conversationId' => (int) $conversation->id,
            'kind' => $kind,
            'name' => $name !== '' ? $name : $conversation->getDisplayName(),
            'participants' => $participants,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function readParticipant(mixed $item): ?array
    {
        if (!is_array($item)) {
            return null;
        }

        $userId = (int) ($item['userId'] ?? 0);
        if ($userId <= 0) {
            return null;
        }

        $name = trim((string) ($item['name'] ?? ''));

        return [
            'userId' => $userId,
            'name' => $name !== '' ? $name : 'Usuário',
            'imageUrl' => trim((string) ($item['imageUrl'] ?? '')),
            'joinedAt' => (int) ($item['joinedAt'] ?? 0),
            'isMicMuted' => !empty($item['isMicMuted']),
            'isDeafened' => !empty($item['isDeafened']),
            'isCameraOn' => !empty($item['isCameraOn']),
            'isScreenSharing' => !empty($item['isScreenSharing']),
        ];
    }

    /**
     * @return int[]
     */
    private function recipientUserIds(Conversation $conversation): array
    {
        $ids = array_map('intval', Membership::find()
            ->select('user_id')
            ->where([
                'conversation_id' => $conversation->id,
                'status' => Membership::STATUS_ACTIVE,
            ])
            ->column());

        if ($conversation->isOpenSpaceChannel()) {
            $ids = array_merge($ids, array_map('intval', SpaceMembership::find()
                ->select('user_id')
                ->where([
                    'space_id' => (int) $conversation->space_id,
                    'status' => SpaceMembership::STATUS_MEMBER,
                ])
                ->column()));
        }

        return array_values(array_unique(array_filter($ids)));
    }

    private function fail(int $status, string $message): array
    {
        Yii::$app->response->statusCode = $status;

        return ['message' => $message];
    }
}
