<?php

namespace humhub\modules\nexchat\controllers;

use humhub\components\Controller;
use humhub\modules\nexchat\components\BearerLogin;
use humhub\modules\nexchat\models\Conversation;
use humhub\modules\nexchat\models\SpaceEvent;
use humhub\modules\space\models\Membership;
use humhub\modules\space\models\Space;
use humhub\modules\user\models\User;
use Yii;
use yii\web\Response;
use yii\web\UploadedFile;

/**
 * Eventos do servidor de chat.
 * Lista os próximos, cria para gestores do espaço e serve a imagem de apresentação.
 */
class EventController extends Controller
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

    /**
     * Lista os eventos futuros do servidor.
     * Exige membro (ou admin do sistema) e devolve também se o ator pode criar.
     */
    public function actionIndex()
    {
        $space = $this->requireMemberSpace((int) Yii::$app->request->get('spaceId', 0));
        if (!($space instanceof Space)) {
            return $space;
        }

        $canCreate = $this->canCreateEvents($space);
        if (!SpaceEvent::ensureTable()) {
            return [
                'success' => true,
                'canCreate' => $canCreate,
                'events' => [],
            ];
        }

        $events = SpaceEvent::find()
            ->where(['space_id' => (int) $space->id])
            ->andWhere(['>=', 'starts_at', date('Y-m-d H:i:s', time() - 7200)])
            ->orderBy(['starts_at' => SORT_ASC])
            ->all();

        return [
            'success' => true,
            'canCreate' => $canCreate,
            'events' => array_map(
                fn(SpaceEvent $event) => $this->eventPayload($event, $canCreate),
                $events,
            ),
        ];
    }

    /**
     * Cria um evento no servidor.
     * Valida local, data e permissão de gestão; grava imagem se vier no pedido.
     */
    public function actionCreate()
    {
        $body = Yii::$app->request->getBodyParams();
        $space = $this->requireMemberSpace((int) ($body['spaceId'] ?? $body['space_id'] ?? 0));
        if (!($space instanceof Space)) {
            return $space;
        }

        if (!$this->canCreateEvents($space)) {
            return $this->fail(403, 'Você não pode criar eventos neste servidor.');
        }

        if (!SpaceEvent::ensureTable()) {
            return $this->fail(503, 'Não foi possível preparar a tabela de eventos.');
        }

        $title = trim((string) ($body['title'] ?? ''));
        if ($title === '') {
            return $this->fail(400, 'Informe o assunto do evento.');
        }

        $locationKind = (string) ($body['locationKind'] ?? $body['location_kind'] ?? '');
        if (!in_array($locationKind, SpaceEvent::locationKinds(), true)) {
            return $this->fail(400, 'Informe onde o evento acontece.');
        }

        $frequency = (string) ($body['frequency'] ?? SpaceEvent::FREQUENCY_NONE);
        if (!in_array($frequency, SpaceEvent::frequencies(), true)) {
            return $this->fail(400, 'Frequência inválida.');
        }

        $startsAt = $this->parseStartsAt((string) ($body['startsAt'] ?? $body['starts_at'] ?? ''));
        if ($startsAt === null) {
            return $this->fail(400, 'Informe a data e a hora de início.');
        }

        $conversationId = (int) ($body['conversationId'] ?? $body['conversation_id'] ?? 0);
        $locationText = trim((string) ($body['locationText'] ?? $body['location_text'] ?? ''));
        $channel = $this->resolveLocationChannel($space, $locationKind, $conversationId);
        if (is_string($channel)) {
            return $this->fail(400, $channel);
        }

        if ($locationKind === SpaceEvent::KIND_ELSEWHERE && $locationText === '') {
            return $this->fail(400, 'Informe a localização do evento.');
        }

        $event = new SpaceEvent([
            'space_id' => (int) $space->id,
            'created_by' => (int) Yii::$app->user->id,
            'title' => mb_substr($title, 0, 160),
            'description' => trim((string) ($body['description'] ?? '')),
            'location_kind' => $locationKind,
            'conversation_id' => $channel ? (int) $channel->id : null,
            'location_text' => $locationKind === SpaceEvent::KIND_ELSEWHERE
                ? mb_substr($locationText, 0, 255)
                : null,
            'starts_at' => $startsAt,
            'frequency' => $frequency,
        ]);

        if (!$event->save()) {
            return $this->fail(400, 'Não foi possível criar o evento.');
        }

        $image = UploadedFile::getInstanceByName('image');
        if ($image) {
            $imageError = $event->storeImage($image);
            if ($imageError !== null) {
                return $this->fail(400, $imageError);
            }
        }

        $event->setInterested((int) Yii::$app->user->id, true);

        return [
            'success' => true,
            'event' => $this->eventPayload($event, true),
        ];
    }

    /**
     * Alterna o interesse do ator no evento.
     * Exige membro do servidor e devolve o evento atualizado.
     */
    public function actionInterest()
    {
        $body = Yii::$app->request->getBodyParams();
        $event = SpaceEvent::ensureTable()
            ? SpaceEvent::findOne(['id' => (int) ($body['eventId'] ?? $body['event_id'] ?? 0)])
            : null;
        if (!$event) {
            return $this->fail(404, 'Evento não encontrado.');
        }

        $space = $this->requireMemberSpace((int) $event->space_id);
        if (!($space instanceof Space)) {
            return $space;
        }

        $event->toggleInterest((int) Yii::$app->user->id);

        return [
            'success' => true,
            'event' => $this->eventPayload($event, $this->canCreateEvents($space)),
        ];
    }

    /**
     * Envia o binário da imagem de apresentação.
     * Confere se o ator é membro do servidor do evento.
     */
    public function actionImage()
    {
        Yii::$app->response->format = Response::FORMAT_RAW;

        $event = SpaceEvent::ensureTable()
            ? SpaceEvent::findOne(['id' => (int) Yii::$app->request->get('id', 0)])
            : null;
        if (!$event) {
            Yii::$app->response->format = Response::FORMAT_JSON;

            return $this->fail(404, 'Evento não encontrado.');
        }

        $space = $this->requireMemberSpace((int) $event->space_id);
        if (!($space instanceof Space)) {
            Yii::$app->response->format = Response::FORMAT_JSON;

            return $space;
        }

        $path = $event->getImagePath();
        if (!$path) {
            Yii::$app->response->format = Response::FORMAT_JSON;

            return $this->fail(404, 'Este evento não tem imagem.');
        }

        return Yii::$app->response->sendFile(
            $path,
            $event->image_name,
            [
                'mimeType' => $event->image_mime ?: 'application/octet-stream',
                'inline' => true,
            ],
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function eventPayload(SpaceEvent $event, bool $canCreate): array
    {
        $creator = User::findOne(['id' => (int) $event->created_by]);
        $channel = $event->conversation_id
            ? Conversation::findOne(['id' => (int) $event->conversation_id])
            : null;
        $canEdit = $canCreate || (int) $event->created_by === (int) Yii::$app->user->id;

        return $event->toPayload($creator ?: null, $channel, $canEdit);
    }

    /**
     * @return Conversation|null|string
     */
    private function resolveLocationChannel(Space $space, string $locationKind, int $conversationId)
    {
        if ($locationKind !== SpaceEvent::KIND_VOICE) {
            return null;
        }

        if ($conversationId <= 0) {
            return 'Selecione um canal de voz.';
        }

        $channel = Conversation::findOne([
            'id' => $conversationId,
            'type' => Conversation::TYPE_CHANNEL,
            'space_id' => (int) $space->id,
        ]);
        if (!$channel || (string) $channel->channel_kind !== Conversation::KIND_VOICE) {
            return 'Canal de voz inválido.';
        }

        return $channel;
    }

    private function parseStartsAt(string $value): ?string
    {
        $trimmed = trim($value);
        if ($trimmed === '') {
            return null;
        }

        $timestamp = strtotime($trimmed);
        if ($timestamp === false) {
            return null;
        }

        return date('Y-m-d H:i:s', $timestamp);
    }

    /**
     * @return Space|array
     */
    private function requireMemberSpace(int $spaceId)
    {
        if ($spaceId <= 0) {
            return $this->fail(400, 'Servidor inválido.');
        }

        $space = Space::findOne(['id' => $spaceId]);
        if (!$space) {
            return $this->fail(404, 'Servidor não encontrado.');
        }

        if ($this->isSystemAdmin() || $this->currentMembership($space) !== null) {
            return $space;
        }

        return $this->fail(403, 'Você não tem acesso a este servidor.');
    }

    /**
     * Diz se o ator pode criar eventos no servidor.
     * Admin do sistema ou dono/admin/moderador do espaço.
     */
    private function canCreateEvents(Space $space): bool
    {
        if ($this->isSystemAdmin()) {
            return true;
        }

        if (method_exists($space, 'isAdmin') && $space->isAdmin()) {
            return true;
        }

        if (method_exists($space, 'isModerator') && $space->isModerator()) {
            return true;
        }

        $membership = $this->currentMembership($space);
        if (!$membership || !$membership->hasAttribute('group_id')) {
            return false;
        }

        return in_array((string) $membership->group_id, $this->manageGroupIds(), true);
    }

    /**
     * @return string[]
     */
    private function manageGroupIds(): array
    {
        $groups = [];
        foreach (['USERGROUP_OWNER', 'USERGROUP_ADMIN', 'USERGROUP_MODERATOR'] as $constant) {
            if (defined(Space::class . '::' . $constant)) {
                $groups[] = (string) constant(Space::class . '::' . $constant);
            }
        }

        return $groups;
    }

    private function currentMembership(Space $space): ?Membership
    {
        return Membership::findOne([
            'space_id' => $space->id,
            'user_id' => (int) Yii::$app->user->id,
            'status' => Membership::STATUS_MEMBER,
        ]);
    }

    private function isSystemAdmin(): bool
    {
        $identity = Yii::$app->user->identity;

        return $identity && method_exists($identity, 'isSystemAdmin') && $identity->isSystemAdmin();
    }

    /**
     * @return array{success: bool, message: string}
     */
    private function fail(int $status, string $message): array
    {
        Yii::$app->response->statusCode = $status;

        return ['success' => false, 'message' => $message];
    }
}
