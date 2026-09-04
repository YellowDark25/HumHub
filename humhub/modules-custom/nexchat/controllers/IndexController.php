<?php

namespace humhub\modules\nexchat\controllers;

use humhub\components\Controller;
use humhub\modules\notification\components\BaseNotification;
use humhub\modules\nexchat\assets\NexchatAsset;
use humhub\modules\nexchat\components\BearerLogin;
use humhub\modules\nexchat\components\KaizzenConfig;
use humhub\modules\nexchat\components\NexchatFriendship;
use humhub\modules\nexchat\components\NexchatMercure;
use humhub\modules\nexchat\components\SecretaryBridge;
use humhub\modules\nexchat\models\GoogleAccount;
use humhub\modules\nexchat\Module;
use humhub\modules\nexchat\models\Attachment;
use humhub\modules\nexchat\models\Conversation;
use humhub\modules\nexchat\models\Membership;
use humhub\modules\nexchat\models\Message;
use humhub\modules\nexchat\models\Reaction;
use humhub\modules\nexchat\models\ServerNotificationPreference;
use humhub\modules\nexchat\models\SpaceServer;
use humhub\modules\nexchat\notifications\ChannelInvite;
use humhub\modules\nexchat\notifications\NewChannelMessage;
use humhub\modules\nexchat\notifications\NewDmMessage;
use humhub\modules\space\models\Membership as SpaceMembership;
use humhub\modules\space\models\Space;
use humhub\modules\user\models\User;
use Yii;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;
use yii\web\Response;
use yii\web\UploadedFile;

class IndexController extends Controller
{
    private const MESSAGE_PAGE_SIZE = 50;

    /** @var array<int, array{lastMessageId: int, messageCount: int}>|null */
    private $messageStats;

    /**
     * Autentica Bearer e, no cano da secretária, o header do serviço.
     * Desliga CSRF nesses dois casos e liga o parser JSON no request do serviço.
     */
    public function beforeAction($action)
    {
        BearerLogin::authenticate();

        if (BearerLogin::hasBearer() || KaizzenConfig::hasServiceSecretHeader()) {
            $this->enableCsrfValidation = false;
        }

        if (KaizzenConfig::hasServiceSecretHeader()) {
            KaizzenConfig::enableJsonParser();
        }

        return parent::beforeAction($action);
    }

    /**
     * Libera as actions do cano da secretária para o Next (sem sessão de usuário).
     * O segredo do serviço continua obrigatório em cada action.
     */
    protected function getAccessRules()
    {
        return [
            [
                'guestAccess' => [
                    'secretary-reply',
                    'secretary-history',
                    'secretary-file',
                    'secretary-google',
                    'secretary-typing',
                ],
            ],
        ];
    }

    public function actionIndex()
    {
        $data = $this->buildPageData();
        $this->view->params['nexchatSidebar'] = $data;
        $this->registerChatAssets();

        return $this->render('index', $data);
    }

    public function actionBootstrap()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $data = $this->buildPageData();

        return [
            'success' => true,
            'channels' => array_map([$this, 'conversationToItem'], $data['channelConversations']),
            'dms' => array_map([$this, 'conversationToItem'], $data['dmConversations']),
            'pendingInvites' => array_map([$this, 'conversationToItem'], $data['pendingInvites']),
            'contacts' => $this->listContacts((int) Yii::$app->user->id),
            'spaceServerIds' => $this->spaceServerIds(),
        ];
    }

    public function actionMutualServers()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $userId = (int) Yii::$app->request->get('userId', 0);
        if ($userId <= 0 || $userId === (int) Yii::$app->user->id) {
            return ['success' => true, 'servers' => []];
        }

        return [
            'success' => true,
            'servers' => $this->listMutualServers($userId),
        ];
    }

    public function actionEnableSpaceServer()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $spaceId = (int) Yii::$app->request->post('space_id', 0);
        if ($spaceId <= 0 || !$this->canCreateChannelInSpace($spaceId)) {
            return ['success' => false, 'error' => 'Você não pode criar servidor neste espaço.'];
        }

        SpaceServer::enable($spaceId);

        return ['success' => true, 'spaceId' => $spaceId];
    }

    public function actionNotificationPreference()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $spaceId = $this->readPreferenceSpaceId((int) Yii::$app->request->get('space_id', 0));
        if ($spaceId === null) {
            return ['success' => false, 'error' => 'Servidor inválido.'];
        }

        if (!ServerNotificationPreference::tableExists()) {
            return array_merge(
                ['success' => true],
                ServerNotificationPreference::emptyPayload($spaceId),
            );
        }

        return array_merge(
            ['success' => true],
            ServerNotificationPreference::forUser((int) Yii::$app->user->id, $spaceId)->toPayload(),
        );
    }

    public function actionSaveNotificationPreference()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $body = Yii::$app->request->getBodyParams();
        $spaceId = $this->readPreferenceSpaceId((int) ($body['space_id'] ?? $body['spaceId'] ?? -1));
        if ($spaceId === null) {
            return ['success' => false, 'error' => 'Servidor inválido.'];
        }

        $preference = ServerNotificationPreference::forUser((int) Yii::$app->user->id, $spaceId);
        $preference->applyLevel(isset($body['level']) ? (string) $body['level'] : null);
        $preference->applyMute(
            array_key_exists('muteDuration', $body) ? ($body['muteDuration'] !== null ? (string) $body['muteDuration'] : null) : null,
            array_key_exists('muteDuration', $body),
        );

        if (!$preference->persist()) {
            return ['success' => false, 'error' => 'Não foi possível salvar as preferências.'];
        }

        return array_merge(['success' => true], $preference->toPayload());
    }

    public function actionView($id)
    {
        $conversation = $this->findConversation((int) $id);
        $totalMessages = (int) Message::find()->where(['conversation_id' => $conversation->id])->count();

        $messages = Message::find()
            ->where(['conversation_id' => $conversation->id])
            ->with(['author', 'attachments', 'reactions', 'reactions.user', 'replyTo', 'replyTo.author', 'replyTo.attachments'])
            ->orderBy(['id' => SORT_DESC])
            ->limit(self::MESSAGE_PAGE_SIZE)
            ->all();
        $messages = array_reverse($messages);

        $data = array_merge($this->buildPageData($conversation), [
            'conversation' => $conversation,
            'messages' => $messages,
            'hasMoreHistory' => $totalMessages > count($messages),
            'oldestMessageId' => !empty($messages) ? (int) $messages[0]->id : 0,
            'activeConversation' => $conversation,
        ]);

        $this->view->params['nexchatSidebar'] = $data;
        $this->registerChatAssets((int) $conversation->id);

        return $this->render('view', $data);
    }

    public function actionCreateChannel()
    {
        $name = trim((string) Yii::$app->request->post('name', ''));
        $channelKind = (string) Yii::$app->request->post('channel_kind', Conversation::KIND_TEXT);
        $spaceId = (int) Yii::$app->request->post('space_id', 0);
        $isPrivate = filter_var(
            Yii::$app->request->post('is_private', false),
            FILTER_VALIDATE_BOOLEAN,
        );
        $asJson = BearerLogin::hasBearer();

        if ($asJson) {
            Yii::$app->response->format = Response::FORMAT_JSON;
        }

        if ($name === '') {
            return $this->createChannelFailure($asJson, 'Informe o nome do canal.');
        }

        if (!in_array($channelKind, Conversation::channelKinds(), true)) {
            return $this->createChannelFailure($asJson, 'Tipo de canal inválido.');
        }

        if ($spaceId > 0 && !$this->canCreateChannelInSpace($spaceId)) {
            return $this->createChannelFailure($asJson, 'Você não pode criar canal neste espaço.');
        }

        $conversation = Conversation::createChannel(
            $name,
            (int) Yii::$app->user->id,
            $spaceId > 0 ? $spaceId : null,
            $channelKind,
            $isPrivate,
        );

        if ($asJson) {
            return [
                'success' => true,
                'conversation' => $this->conversationToItem($conversation),
            ];
        }

        Yii::$app->session->setFlash('success', 'Canal criado com sucesso.');

        return $this->redirect(['view', 'id' => $conversation->id]);
    }

    private function createChannelFailure(bool $asJson, string $message)
    {
        if ($asJson) {
            return ['success' => false, 'error' => $message];
        }

        Yii::$app->session->setFlash('error', $message);

        return $this->redirect(['index']);
    }

    /**
     * @return array<int, array{id: int, name: string, guid: string}>
     */
    private function listMutualServers(int $peerUserId): array
    {
        $mine = $this->spaceServerIds();
        if ($mine === []) {
            return [];
        }

        $peerIds = array_map(
            'intval',
            SpaceMembership::find()
                ->select('space_id')
                ->where([
                    'user_id' => $peerUserId,
                    'status' => SpaceMembership::STATUS_MEMBER,
                ])
                ->column(),
        );
        $sharedIds = array_values(array_intersect($mine, $peerIds));
        if ($sharedIds === []) {
            return [];
        }

        $servers = [];
        foreach (Space::find()->where(['id' => $sharedIds])->all() as $space) {
            $servers[] = [
                'id' => (int) $space->id,
                'name' => (string) $space->getDisplayName(),
                'guid' => (string) $space->guid,
            ];
        }

        return $servers;
    }

    /**
     * @return int[]
     */
    private function spaceServerIds(): array
    {
        $memberSpaceIds = $this->memberSpaceIds();
        if ($memberSpaceIds === []) {
            return [];
        }

        if (Yii::$app->db->getTableSchema(SpaceServer::tableName(), true) === null) {
            return $memberSpaceIds;
        }

        return array_values(array_intersect($memberSpaceIds, SpaceServer::spaceIds()));
    }

    /**
     * @return int[]
     */
    private function memberSpaceIds(): array
    {
        return array_map(
            'intval',
            SpaceMembership::find()
                ->select('space_id')
                ->where([
                    'user_id' => (int) Yii::$app->user->id,
                    'status' => SpaceMembership::STATUS_MEMBER,
                ])
                ->column(),
        );
    }

    private function canCreateChannelInSpace(int $spaceId): bool
    {
        $space = Space::findOne(['id' => $spaceId]);
        if ($space === null) {
            return false;
        }

        $identity = Yii::$app->user->identity;
        $isSystemAdmin = $identity && method_exists($identity, 'isSystemAdmin')
            ? $identity->isSystemAdmin()
            : false;

        return $isSystemAdmin || $space->isMember();
    }

    private function readOptionalInt(Conversation $conversation, string $attribute): ?int
    {
        if (!$conversation->hasAttribute($attribute) || $conversation->$attribute === null) {
            return null;
        }

        return (int) $conversation->$attribute;
    }

    private function readOptionalString(Conversation $conversation, string $attribute): ?string
    {
        if (!$conversation->hasAttribute($attribute) || $conversation->$attribute === null) {
            return null;
        }

        return (string) $conversation->$attribute;
    }

    /**
     * Serializa a conversa para o bootstrap da intranet.
     * Inclui último id e total de mensagens para o badge de não lidas.
     *
     * @return array{
     *   id: int,
     *   type: string,
     *   name: string,
     *   spaceId: int|null,
     *   channelKind: string|null,
     *   isPrivate: bool,
     *   lastMessageId: int,
     *   messageCount: int
     * }
     */
    private function conversationToItem(Conversation $conversation): array
    {
        $isChannel = $conversation->type === Conversation::TYPE_CHANNEL;
        $stat = $this->messageStat((int) $conversation->id);

        return [
            'id' => (int) $conversation->id,
            'type' => $conversation->type,
            'name' => $conversation->getDisplayName(),
            'spaceId' => $this->readOptionalInt($conversation, 'space_id'),
            'channelKind' => $isChannel
                ? ($this->readOptionalString($conversation, 'channel_kind') ?: Conversation::KIND_TEXT)
                : null,
            'isPrivate' => (bool) $this->readOptionalInt($conversation, 'is_private'),
            'topic' => $this->readOptionalString($conversation, 'topic') ?? '',
            'slowModeSeconds' => $this->readOptionalInt($conversation, 'slow_mode_seconds') ?? 0,
            'parentId' => $this->readOptionalInt($conversation, 'parent_id'),
            'isAdmin' => $isChannel && $conversation->isAdmin((int) Yii::$app->user->id),
            'lastMessageId' => $stat['lastMessageId'],
            'messageCount' => $stat['messageCount'],
            'isSecretary' => $conversation->isSecretaryThread(),
        ];
    }

    public function actionListTopics()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $parent = $this->topicRoot(
            $this->findConversation((int) Yii::$app->request->get('conversation_id', 0)),
        );

        if (!$this->conversationHasParentColumn()) {
            return ['success' => true, 'topics' => []];
        }

        $userId = (int) Yii::$app->user->id;
        $topics = [];
        foreach (Conversation::findTopics((int) $parent->id) as $topic) {
            if ($topic->canAccess($userId)) {
                $topics[] = $this->topicToItem($topic);
            }
        }

        return ['success' => true, 'topics' => $topics];
    }

    public function actionCreateTopic()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        if (!$this->conversationHasParentColumn()) {
            return ['success' => false, 'error' => 'Tópicos ainda não estão disponíveis.'];
        }

        $body = Yii::$app->request->getBodyParams();
        $conversationId = (int) ($body['conversation_id'] ?? Yii::$app->request->post('conversation_id', 0));
        $parent = $this->topicRoot($this->findConversation($conversationId));
        if ($parent->type !== Conversation::TYPE_CHANNEL) {
            return ['success' => false, 'error' => 'Tópicos só podem ser criados em canais.'];
        }

        $name = trim((string) ($body['name'] ?? Yii::$app->request->post('name', '')));
        if ($name === '' || mb_strlen($name) > 100) {
            return ['success' => false, 'error' => 'Informe um nome válido (até 100 caracteres).'];
        }

        $isPrivate = filter_var(
            $body['is_private'] ?? Yii::$app->request->post('is_private', false),
            FILTER_VALIDATE_BOOLEAN,
        );
        $conversation = Conversation::createTopic(
            $parent,
            $name,
            (int) Yii::$app->user->id,
            $isPrivate,
        );

        $message = trim((string) ($body['message'] ?? Yii::$app->request->post('message', '')));
        if ($message !== '') {
            $this->saveTopicMessage($conversation, $message);
            $conversation->refresh();
        }

        return [
            'success' => true,
            'conversation' => $this->conversationToItem($conversation),
            'topic' => $this->topicToItem($conversation),
        ];
    }

    public function actionChannelSettings()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $conversation = $this->findConversation((int) Yii::$app->request->get('id', 0));
        $this->assertChannelAdmin($conversation);

        return [
            'success' => true,
            'conversation' => $this->conversationToItem($conversation),
            'members' => $this->channelMembers($conversation, Membership::STATUS_ACTIVE),
            'pendingInvites' => $this->channelMembers($conversation, Membership::STATUS_PENDING),
            'invitableUsers' => $this->invitableUsers($conversation),
        ];
    }

    /**
     * Lista os membros do canal com presença, para a barra lateral da intranet.
     * Qualquer participante pode chamar; tópico vira o canal pai e junta membership + espaço aberto.
     */
    public function actionChannelMembers()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $conversation = $this->topicRoot(
            $this->findConversation((int) Yii::$app->request->get('id', 0)),
        );
        if ($conversation->type !== Conversation::TYPE_CHANNEL) {
            Yii::$app->response->statusCode = 400;

            return ['success' => false, 'error' => 'Apenas canais têm lista de membros.'];
        }

        return [
            'success' => true,
            'members' => $this->channelRoster($conversation),
        ];
    }

    public function actionUpdateChannel()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $conversation = $this->findConversation((int) Yii::$app->request->post('conversation_id', 0));
        $this->assertChannelAdmin($conversation);

        $name = trim((string) Yii::$app->request->post('name', $conversation->name));
        $topic = trim((string) Yii::$app->request->post('topic', ''));
        $slowMode = (int) Yii::$app->request->post('slow_mode_seconds', 0);

        if ($name === '' || mb_strlen($name) > 100) {
            return ['success' => false, 'error' => 'Informe um nome válido (até 100 caracteres).'];
        }

        if (mb_strlen($topic) > 1024) {
            return ['success' => false, 'error' => 'O assunto do canal pode ter no máximo 1024 caracteres.'];
        }

        if ($slowMode < 0) {
            return ['success' => false, 'error' => 'Modo lento inválido.'];
        }

        $conversation->name = $name;
        if ($conversation->hasAttribute('topic')) {
            $conversation->topic = $topic === '' ? null : $topic;
        }
        if ($conversation->hasAttribute('slow_mode_seconds')) {
            $conversation->slow_mode_seconds = $slowMode;
        }

        if (!$conversation->save()) {
            return ['success' => false, 'error' => 'Não foi possível salvar o canal.'];
        }

        return [
            'success' => true,
            'conversation' => $this->conversationToItem($conversation),
        ];
    }

    /**
     * @return array<int, array{userId: int, name: string, isAdmin: bool}>
     */
    private function channelMembers(Conversation $conversation, string $status): array
    {
        $rows = [];
        $memberships = Membership::find()
            ->where(['conversation_id' => $conversation->id, 'status' => $status])
            ->with('user')
            ->all();

        foreach ($memberships as $membership) {
            $rows[] = [
                'userId' => (int) $membership->user_id,
                'name' => $membership->user->displayName ?? 'Usuário',
                'isAdmin' => $membership->role === Membership::ROLE_ADMIN,
            ];
        }

        return $rows;
    }

    /**
     * Monta o roster do canal com foto, cargo e se a pessoa está online.
     * Junta os usuários ativos, marca admins e ordena pelo nome.
     * @return array<int, array{userId: int, name: string, username: string, guid: string, title: string, isAdmin: bool, isOnline: bool}>
     */
    private function channelRoster(Conversation $conversation): array
    {
        $adminIds = array_fill_keys($this->channelAdminIds($conversation), true);
        $rows = [];
        foreach ($this->activeChannelUsers($conversation) as $user) {
            $rows[] = [
                'userId' => (int) $user->id,
                'name' => (string) ($user->displayName ?? $user->username ?? 'Usuário'),
                'username' => (string) ($user->username ?? ''),
                'guid' => (string) ($user->guid ?? ''),
                'title' => trim((string) ($user->profile?->title ?? '')),
                'isAdmin' => isset($adminIds[(int) $user->id]),
                'isOnline' => $this->isUserOnline($user),
            ];
        }

        usort($rows, static fn(array $left, array $right) => strcasecmp($left['name'], $right['name']));

        return $rows;
    }

    /**
     * Ids dos administradores ativos do canal.
     * Lê nexchat_membership com role admin; usado só para marcar o cargo no roster.
     * @return int[]
     */
    private function channelAdminIds(Conversation $conversation): array
    {
        return array_map(
            'intval',
            Membership::find()
                ->select('user_id')
                ->where([
                    'conversation_id' => $conversation->id,
                    'role' => Membership::ROLE_ADMIN,
                    'status' => Membership::STATUS_ACTIVE,
                ])
                ->column(),
        );
    }

    /**
     * @return array<int, array{userId: int, name: string}>
     */
    private function invitableUsers(Conversation $conversation): array
    {
        $linkedUserIds = Membership::find()
            ->select('user_id')
            ->where(['conversation_id' => $conversation->id])
            ->column();

        $users = User::find()
            ->active()
            ->where(['!=', 'id', (int) Yii::$app->user->id])
            ->andFilterWhere(['not in', 'id', $linkedUserIds ?: [0]])
            ->orderBy(['username' => SORT_ASC])
            ->all();

        return array_map(static fn(User $user) => [
            'userId' => (int) $user->id,
            'name' => $user->getDisplayName(),
            'username' => (string) $user->username,
            'guid' => (string) $user->guid,
        ], $users);
    }

    public function actionStartDm()
    {
        $targetUserId = (int) Yii::$app->request->post('user_id', 0);
        if ($this->findActiveUser($targetUserId) === null) {
            Yii::$app->session->setFlash('error', 'Selecione um usuário.');
            return $this->redirect(['index']);
        }

        $denied = $this->requireFriendship((int) Yii::$app->user->id, $targetUserId);
        if ($denied !== null) {
            Yii::$app->session->setFlash('error', $denied);
            return $this->redirect(['index']);
        }

        $conversation = Conversation::findOrCreateDm((int) Yii::$app->user->id, $targetUserId);

        return $this->redirect(['view', 'id' => $conversation->id]);
    }

    public function actionOpenDm()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $targetUserId = (int) Yii::$app->request->post('user_id', 0);
        if (
            $targetUserId === (int) Yii::$app->user->id
            || $this->findActiveUser($targetUserId) === null
        ) {
            return ['success' => false, 'error' => 'Este usuário não está mais disponível.'];
        }

        $denied = $this->requireFriendship((int) Yii::$app->user->id, $targetUserId);
        if ($denied !== null) {
            return ['success' => false, 'error' => $denied];
        }

        $conversation = Conversation::findOrCreateDm((int) Yii::$app->user->id, $targetUserId);

        return [
            'success' => true,
            'url' => \yii\helpers\Url::to(['/nexchat/index/view', 'id' => $conversation->id]),
            'conversation' => [
                'id' => (int) $conversation->id,
                'type' => $conversation->type,
                'name' => $conversation->getDisplayName(),
            ],
        ];
    }

    /**
     * Abre ou cria o fio da secretária do usuário autenticado.
     * Não recebe userId — a conversa é de sistema, só com o dono.
     */
    public function actionOpenSecretary()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;
        $conversation = Conversation::findOrCreateSecretary((int) Yii::$app->user->id);

        return [
            'success' => true,
            'conversation' => $this->conversationToItem($conversation),
        ];
    }

    /**
     * Envia mensagem (texto e/ou anexo) e avisa o Mercure.
     * Se a DM for com a secretária, dispara o turno no Next depois de publicar.
     */
    public function actionSend()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $conversationId = (int) Yii::$app->request->post('conversation_id', 0);
        $content = trim((string) Yii::$app->request->post('content', ''));

        $conversation = $this->findConversation($conversationId);

        $uploadedFiles = UploadedFile::getInstancesByName('files');

        if ($content === '' && empty($uploadedFiles)) {
            return ['success' => false, 'error' => 'Mensagem vazia.'];
        }

        $replyToId = (int) Yii::$app->request->post('reply_to_id', 0);
        if ($replyToId > 0) {
            $replyTarget = Message::findOne($replyToId);
            if (!$replyTarget || (int) $replyTarget->conversation_id !== (int) $conversation->id) {
                $replyToId = 0;
            }
        }

        $message = new Message([
            'conversation_id' => $conversation->id,
            'user_id' => (int) Yii::$app->user->id,
            'content' => $content,
            'reply_to_id' => $replyToId ?: null,
        ]);

        if (!$message->save()) {
            return ['success' => false, 'error' => 'Não foi possível enviar a mensagem.'];
        }

        $errors = [];
        foreach ($uploadedFiles as $uploadedFile) {
            $error = $this->storeAttachment($message, $uploadedFile);
            if ($error !== null) {
                $errors[] = $error;
            }
        }

        if (empty($message->attachments) && $content === '') {
            $message->delete();
            return ['success' => false, 'error' => $errors[0] ?? 'Falha no envio do anexo.'];
        }

        $message->refresh();

        try {
            NexchatMercure::publishNewMessage($message);
        } catch (\Throwable $e) {
            Yii::error($e, 'nexchat');
        }

        try {
            SecretaryBridge::dispatchAfterSend($conversation, $message);
        } catch (\Throwable $e) {
            Yii::error($e, 'nexchat');
        }

        $this->notifyRecipients($conversation, $message);

        return [
            'success' => true,
            'message' => $message->toPayload(),
            'warnings' => $errors,
        ];
    }

    public function actionTyping()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        if (Yii::$app->user->isGuest) {
            return ['success' => false, 'error' => 'Não autenticado.'];
        }

        $conversationId = (int) Yii::$app->request->post('conversation_id', 0);
        $isTyping = filter_var(Yii::$app->request->post('is_typing', false), FILTER_VALIDATE_BOOLEAN);
        $conversation = $this->findConversation($conversationId);
        $author = Yii::$app->user->identity;

        try {
            NexchatMercure::publishTyping(
                (int) $conversation->id,
                (int) Yii::$app->user->id,
                $author?->displayName ?: 'Alguém',
                $isTyping,
            );
        } catch (\Throwable $e) {
            Yii::error($e, 'nexchat');
        }

        return ['success' => true];
    }

    /**
     * Recebe a fala da secretária (serviço Next) e grava na DM.
     * Autentica pelo header X-Kaizzen-Secret e responde como o usuário da secretária.
     */
    public function actionSecretaryReply()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;
        $body = Yii::$app->request->getBodyParams();
        $payload = SecretaryBridge::reply(
            (int) ($body['conversationId'] ?? 0),
            trim((string) ($body['content'] ?? '')),
        );

        return ['success' => true, 'message' => $payload];
    }

    /**
     * Histórico recente da DM para o turno da secretária.
     * Autentica pelo segredo do serviço.
     */
    public function actionSecretaryHistory()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;
        $conversationId = (int) Yii::$app->request->get('conversationId', Yii::$app->request->get('id', 0));

        return [
            'success' => true,
            'messages' => SecretaryBridge::history($conversationId),
        ];
    }

    /**
     * Anexo da DM para o Next transcrever.
     * Autentica pelo segredo do serviço.
     */
    public function actionSecretaryFile($id)
    {
        return SecretaryBridge::file((int) $id);
    }

    /**
     * Conta Google do usuário pedida pelo serviço da secretária.
     */
    public function actionSecretaryGoogle()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;
        $userId = (int) Yii::$app->request->get('userId', 0);
        $account = SecretaryBridge::googleAccountForUser($userId);

        return [
            'success' => true,
            'account' => $account,
        ];
    }

    /**
     * Liga ou desliga o indicador de digitação da secretária.
     */
    public function actionSecretaryTyping()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;
        $body = Yii::$app->request->getBodyParams();
        SecretaryBridge::setTyping(
            (int) ($body['conversationId'] ?? 0),
            filter_var($body['isTyping'] ?? false, FILTER_VALIDATE_BOOLEAN),
        );

        return ['success' => true];
    }

    /**
     * Lê, grava ou apaga o vínculo Google do usuário autenticado.
     * GET devolve o status; POST salva tokens; DELETE remove.
     */
    public function actionGoogleAccount()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;
        if (Yii::$app->user->isGuest) {
            return ['success' => false, 'error' => 'Não autenticado.'];
        }

        $userId = (int) Yii::$app->user->id;
        GoogleAccount::ensureTable();
        $method = strtoupper((string) Yii::$app->request->method);

        if ($method === 'DELETE') {
            GoogleAccount::deleteAll(['user_id' => $userId]);
            return ['success' => true, 'connected' => false, 'email' => ''];
        }

        if ($method === 'POST') {
            $body = Yii::$app->request->getBodyParams();
            $refreshToken = trim((string) ($body['refreshToken'] ?? ''));
            $email = trim((string) ($body['email'] ?? ''));
            if ($refreshToken === '' || $email === '') {
                return ['success' => false, 'error' => 'Vínculo Google incompleto.'];
            }

            $account = GoogleAccount::upsert(
                $userId,
                $email,
                $refreshToken,
                self::readOptionalDate($body['expiresAt'] ?? null),
            );

            return array_merge(['success' => true], $account->toStatusPayload());
        }

        $account = GoogleAccount::findOne(['user_id' => $userId]);
        if (!$account) {
            return ['success' => true, 'connected' => false, 'email' => ''];
        }

        return array_merge(['success' => true], $account->toStatusPayload());
    }

    protected function notifyRecipients(Conversation $conversation, Message $message): void
    {
        $author = Yii::$app->user->identity;
        if (!$author) {
            return;
        }

        if ($conversation->isSecretaryThread()) {
            return;
        }

        if ($conversation->type === Conversation::TYPE_DM) {
            $this->notifyDirectMessage($conversation, $message, $author);
            return;
        }

        if ($conversation->type === Conversation::TYPE_CHANNEL) {
            $this->notifyChannelMessage($conversation, $message, $author);
        }
    }

    private function notifyDirectMessage(Conversation $conversation, Message $message, User $author): void
    {
        foreach ($conversation->members as $member) {
            if ((int) $member->id === (int) $author->id) {
                continue;
            }

            $this->sendChatNotice(NewDmMessage::instance(), $author, $message, $member);
        }
    }

    private function notifyChannelMessage(Conversation $conversation, Message $message, User $author): void
    {
        $spaceId = (int) ($conversation->space_id ?: 0);
        $content = (string) $message->content;

        $hasPreferenceTable = ServerNotificationPreference::tableExists();

        foreach ($this->activeChannelUsers($conversation) as $member) {
            if ((int) $member->id === (int) $author->id) {
                continue;
            }

            $isMentioned = ServerNotificationPreference::mentionsUser($content, $member);
            $shouldNotify = $hasPreferenceTable
                ? ServerNotificationPreference::forUser((int) $member->id, $spaceId)->shouldNotify($isMentioned)
                : $isMentioned;
            if (!$shouldNotify) {
                continue;
            }

            $this->sendChatNotice(NewChannelMessage::instance(), $author, $message, $member);
        }
    }

    /**
     * @return User[]
     */
    private function activeChannelUsers(Conversation $conversation): array
    {
        $usersById = [];
        $memberships = Membership::find()
            ->where([
                'conversation_id' => $conversation->id,
                'status' => Membership::STATUS_ACTIVE,
            ])
            ->with(['user.profile'])
            ->all();

        foreach ($memberships as $membership) {
            if ($membership->user) {
                $usersById[(int) $membership->user->id] = $membership->user;
            }
        }

        if ($conversation->isOpenSpaceChannel()) {
            $spaceMemberships = SpaceMembership::find()
                ->where([
                    'space_id' => (int) $conversation->space_id,
                    'status' => SpaceMembership::STATUS_MEMBER,
                ])
                ->with(['user.profile'])
                ->all();

            foreach ($spaceMemberships as $spaceMembership) {
                if ($spaceMembership->user) {
                    $usersById[(int) $spaceMembership->user->id] = $spaceMembership->user;
                }
            }
        }

        return array_values($usersById);
    }

    private function sendChatNotice(BaseNotification $notification, User $author, Message $message, User $member): void
    {
        try {
            $notification
                ->from($author)
                ->about($message)
                ->send($member);
        } catch (\Throwable $error) {
            Yii::error($error, 'nexchat');
        }
    }

    private function readPreferenceSpaceId(int $spaceId): ?int
    {
        if ($spaceId < 0) {
            return null;
        }

        if ($spaceId === 0) {
            return 0;
        }

        return $this->canCreateChannelInSpace($spaceId) ? $spaceId : null;
    }

    protected function storeAttachment(Message $message, UploadedFile $uploadedFile): ?string
    {
        if ($uploadedFile->hasError) {
            return 'Erro no upload de "' . $uploadedFile->name . '".';
        }

        if ($uploadedFile->size > Module::MAX_UPLOAD_SIZE) {
            return 'Arquivo "' . $uploadedFile->name . '" excede o limite de 25 MB.';
        }

        $extension = strtolower((string) $uploadedFile->extension);
        if ($extension === '' || !in_array($extension, Module::ALLOWED_EXTENSIONS, true)) {
            return 'Tipo de arquivo não permitido: "' . $uploadedFile->name . '".';
        }

        $basePath = Module::ensureUploadPath();
        if ($basePath === null) {
            return 'Pasta de anexos do chat indisponível.';
        }

        $mime = (string) ($uploadedFile->type ?: 'application/octet-stream');
        $storedName = bin2hex(random_bytes(16)) . '.' . $extension;
        $targetPath = $basePath . DIRECTORY_SEPARATOR . $storedName;

        try {
            if (!$uploadedFile->saveAs($targetPath)) {
                return 'Não foi possível salvar "' . $uploadedFile->name . '".';
            }
        } catch (\Throwable $e) {
            Yii::error($e, 'nexchat');
            return 'Não foi possível salvar "' . $uploadedFile->name . '".';
        }

        $attachment = new Attachment([
            'message_id' => $message->id,
            'file_name' => mb_substr($uploadedFile->name, 0, 255),
            'stored_name' => $storedName,
            'mime' => $mime,
            'size' => (int) $uploadedFile->size,
            'is_image' => Attachment::isImageMime($mime) && $extension !== 'svg',
        ]);

        if (!$attachment->save()) {
            @unlink($targetPath);
            return 'Falha ao registrar "' . $uploadedFile->name . '".';
        }

        return null;
    }

    public function actionFile($id)
    {
        $attachment = Attachment::findOne((int) $id);
        if (!$attachment) {
            throw new NotFoundHttpException('Arquivo não encontrado.');
        }

        $message = $attachment->message;
        if (!$message) {
            throw new NotFoundHttpException('Arquivo não encontrado.');
        }

        $conversation = Conversation::findOne((int) $message->conversation_id);
        if (!$conversation || !$conversation->canAccess((int) Yii::$app->user->id)) {
            throw new ForbiddenHttpException('Você não tem acesso a este arquivo.');
        }

        $path = $attachment->getFilePath();
        if (!is_file($path)) {
            throw new NotFoundHttpException('Arquivo indisponível.');
        }

        $inline = $attachment->is_image
            || $attachment->mime === 'application/pdf'
            || str_starts_with((string) $attachment->mime, 'audio/');

        return Yii::$app->response->sendFile($path, $attachment->file_name, [
            'mimeType' => $attachment->mime ?: 'application/octet-stream',
            'inline' => $inline,
        ]);
    }

    public function actionReact()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $messageId = (int) Yii::$app->request->post('message_id', 0);
        $emoji = trim((string) Yii::$app->request->post('emoji', ''));
        $userId = (int) Yii::$app->user->id;

        if ($emoji === '' || mb_strlen($emoji) > 16) {
            return ['success' => false, 'error' => 'Emoji inválido.'];
        }

        $message = Message::findOne($messageId);
        if (!$message) {
            return ['success' => false, 'error' => 'Mensagem não encontrada.'];
        }

        $conversation = $this->findConversation((int) $message->conversation_id);

        $existing = Reaction::findOne([
            'message_id' => $message->id,
            'user_id' => $userId,
            'emoji' => $emoji,
        ]);

        if ($existing) {
            $existing->delete();
        } else {
            $reaction = new Reaction([
                'message_id' => $message->id,
                'user_id' => $userId,
                'emoji' => $emoji,
                'created_at' => date('Y-m-d H:i:s'),
            ]);
            $reaction->save();
        }

        $reactions = Reaction::find()
            ->where(['message_id' => $message->id])
            ->with('user')
            ->orderBy(['id' => SORT_ASC])
            ->all();

        try {
            NexchatMercure::publishReaction(
                (int) $conversation->id,
                (int) $message->id,
                Reaction::aggregate($reactions, 0),
            );
        } catch (\Throwable $e) {
            Yii::error($e, 'nexchat');
        }

        return [
            'success' => true,
            'messageId' => (int) $message->id,
            'reactions' => Reaction::aggregate($reactions, $userId),
        ];
    }

    public function actionEdit()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $messageId = (int) Yii::$app->request->post('message_id', 0);
        $content = trim((string) Yii::$app->request->post('content', ''));
        $userId = (int) Yii::$app->user->id;

        $message = Message::findOne($messageId);
        if (!$message) {
            return ['success' => false, 'error' => 'Mensagem não encontrada.'];
        }

        $this->findConversation((int) $message->conversation_id);

        if ((int) $message->user_id !== $userId) {
            return ['success' => false, 'error' => 'Você só pode editar suas próprias mensagens.'];
        }

        if (!$message->isWithinEditWindow()) {
            return ['success' => false, 'error' => 'O prazo de 1 hora para editar esta mensagem expirou.'];
        }

        if ($content === '') {
            return ['success' => false, 'error' => 'A mensagem não pode ficar vazia.'];
        }

        $message->content = $content;
        $message->edited_at = date('Y-m-d H:i:s');

        if (!$message->save()) {
            return ['success' => false, 'error' => 'Não foi possível salvar a edição.'];
        }

        $message->refresh();

        try {
            NexchatMercure::publishMessageEdit($message);
        } catch (\Throwable $e) {
            Yii::error($e, 'nexchat');
        }

        return [
            'success' => true,
            'message' => $message->toPayload(),
        ];
    }

    public function actionDelete()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $messageId = (int) Yii::$app->request->post('message_id', 0);
        $userId = (int) Yii::$app->user->id;

        $message = Message::findOne($messageId);
        if (!$message) {
            return ['success' => false, 'error' => 'Mensagem não encontrada.'];
        }

        $conversation = $this->findConversation((int) $message->conversation_id);

        if ($message->isDeleted()) {
            return ['success' => true, 'message' => $message->toPayload()];
        }

        $isOwner = (int) $message->user_id === $userId;
        $isAdmin = $conversation->type === Conversation::TYPE_CHANNEL && $conversation->isAdmin($userId);

        if (!$isOwner && !$isAdmin) {
            return ['success' => false, 'error' => 'Somente o autor ou um administrador do canal pode excluir esta mensagem.'];
        }

        foreach ($message->attachments as $attachment) {
            $attachment->delete();
        }

        $message->deleted_at = date('Y-m-d H:i:s');
        $message->deleted_by = $userId;
        $message->content = '';
        $message->edited_at = null;

        if (!$message->save(false)) {
            return ['success' => false, 'error' => 'Não foi possível excluir a mensagem.'];
        }

        $message->refresh();

        try {
            NexchatMercure::publishMessageDelete($message);
        } catch (\Throwable $e) {
            Yii::error($e, 'nexchat');
        }

        return ['success' => true, 'message' => $message->toPayload()];
    }

    public function actionForward()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $messageId = (int) Yii::$app->request->post('message_id', 0);
        $comment = trim((string) Yii::$app->request->post('comment', ''));
        $conversationIds = Yii::$app->request->post('conversation_ids', []);
        if (!is_array($conversationIds)) {
            return ['success' => false, 'error' => 'Destinos inválidos.'];
        }

        $conversationIds = array_values(array_unique(array_filter(
            array_map('intval', $conversationIds),
            static fn(int $id) => $id > 0,
        )));

        if ($messageId <= 0 || $conversationIds === []) {
            return ['success' => false, 'error' => 'Selecione pelo menos um destino.'];
        }

        if (count($conversationIds) > 10) {
            return ['success' => false, 'error' => 'Você pode encaminhar para no máximo 10 destinos.'];
        }

        $source = Message::findOne($messageId);
        if (!$source || $source->isDeleted()) {
            return ['success' => false, 'error' => 'Mensagem não encontrada.'];
        }

        $this->findConversation((int) $source->conversation_id);

        $content = $this->forwardedContent($source, $comment);
        if ($content === '' && empty($source->attachments)) {
            return ['success' => false, 'error' => 'Não é possível encaminhar esta mensagem.'];
        }

        $destinations = $this->forwardDestinations($conversationIds);
        if (is_string($destinations)) {
            return ['success' => false, 'error' => $destinations];
        }

        $messages = [];
        foreach ($destinations as $conversation) {
            $message = new Message([
                'conversation_id' => $conversation->id,
                'user_id' => (int) Yii::$app->user->id,
                'content' => $content,
            ]);

            if (!$message->save()) {
                return ['success' => false, 'error' => 'Não foi possível encaminhar a mensagem.'];
            }

            $this->copyAttachments($source, $message);
            $message->refresh();

            try {
                NexchatMercure::publishNewMessage($message);
            } catch (\Throwable $e) {
                Yii::error($e, 'nexchat');
            }

            $this->notifyRecipients($conversation, $message);
            $messages[] = $message->toPayload();
        }

        return ['success' => true, 'messages' => $messages];
    }

    public function actionPoll($id, $since = 0)
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $conversation = $this->findConversation((int) $id);
        $since = (int) $since;

        $messages = Message::find()
            ->where(['conversation_id' => $conversation->id])
            ->with(['author', 'attachments', 'reactions', 'reactions.user', 'replyTo', 'replyTo.author', 'replyTo.attachments'])
            ->andWhere(['>', 'id', $since])
            ->orderBy(['id' => SORT_ASC])
            ->all();

        return [
            'success' => true,
            'messages' => array_map(static fn(Message $message) => $message->toPayload(), $messages),
        ];
    }

    public function actionLoadHistory($id, $before = 0)
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $conversation = $this->findConversation((int) $id);
        $before = (int) $before;

        if ($before <= 0) {
            return ['success' => false, 'error' => 'Referência inválida.'];
        }

        $messages = Message::find()
            ->where(['conversation_id' => $conversation->id])
            ->with(['author', 'attachments', 'reactions', 'reactions.user', 'replyTo', 'replyTo.author', 'replyTo.attachments'])
            ->andWhere(['<', 'id', $before])
            ->orderBy(['id' => SORT_DESC])
            ->limit(self::MESSAGE_PAGE_SIZE)
            ->all();
        $messages = array_reverse($messages);

        return [
            'success' => true,
            'messages' => array_map(static fn(Message $message) => $message->toPayload(), $messages),
            'hasMore' => count($messages) >= self::MESSAGE_PAGE_SIZE,
        ];
    }

    /**
     * Lista o último id e o total de mensagens de cada conversa do usuário.
     * Uma query em lote; a intranet compara com o visto local para o badge.
     */
    public function actionUpdates()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $userId = (int) Yii::$app->user->id;
        $conversations = Conversation::findForUser($userId);
        $ids = array_map(
            static fn(Conversation $conversation) => (int) $conversation->id,
            $conversations,
        );
        $this->ensureMessageStats($ids);
        $previews = $this->lastMessagePreviews($ids);
        $items = [];

        foreach ($conversations as $conversation) {
            $id = (int) $conversation->id;
            $stat = $this->messageStat($id);
            $items[] = [
                'id' => $id,
                'type' => $conversation->type,
                'name' => $conversation->getDisplayName(),
                'lastMessageId' => $stat['lastMessageId'],
                'messageCount' => $stat['messageCount'],
                'preview' => $previews[$id] ?? '',
            ];
        }

        return ['success' => true, 'conversations' => $items];
    }

    public function actionSubscribeToken($id = null)
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        if ($id !== null) {
            $conversation = $this->findConversation((int) $id);
            $config = NexchatMercure::createSubscriberToken($conversation->id);
        } else {
            $ids = array_map(static fn(Conversation $c) => (int) $c->id, Conversation::findForUser((int) Yii::$app->user->id));
            $config = NexchatMercure::createSubscriberTokenForConversations($ids);
        }

        if (empty($config)) {
            return ['success' => false, 'error' => 'Mercure indisponível.'];
        }

        return array_merge(['success' => true], $config);
    }

    public function actionInviteMember()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $conversationId = (int) Yii::$app->request->post('conversation_id', 0);
        $userId = (int) Yii::$app->request->post('user_id', 0);

        $conversation = $this->findConversation($conversationId);
        $this->assertChannelAdmin($conversation);

        if ($userId <= 0) {
            return ['success' => false, 'error' => 'Usuário inválido.'];
        }

        $targetUser = User::findOne($userId);
        if (!$targetUser) {
            return ['success' => false, 'error' => 'Usuário não encontrado.'];
        }

        $existing = Membership::findOne(['conversation_id' => $conversation->id, 'user_id' => $userId]);
        if ($existing) {
            if ($existing->status === Membership::STATUS_ACTIVE) {
                return ['success' => false, 'error' => 'Este usuário já participa do canal.'];
            }

            return ['success' => false, 'error' => 'Já existe um convite pendente para este usuário.'];
        }

        Membership::invite($conversation->id, $userId);

        try {
            ChannelInvite::instance()
                ->from(Yii::$app->user->identity)
                ->about($conversation)
                ->send($targetUser);
        } catch (\Throwable $e) {
            Yii::error($e, 'nexchat');
        }

        return ['success' => true];
    }

    public function actionAcceptInvite()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $conversationId = (int) Yii::$app->request->post('conversation_id', 0);
        $userId = (int) Yii::$app->user->id;

        $membership = Membership::findOne([
            'conversation_id' => $conversationId,
            'user_id' => $userId,
            'status' => Membership::STATUS_PENDING,
        ]);

        if (!$membership) {
            return ['success' => false, 'error' => 'Convite não encontrado.'];
        }

        $membership->status = Membership::STATUS_ACTIVE;
        $membership->joined_at = date('Y-m-d H:i:s');

        if (!$membership->save()) {
            return ['success' => false, 'error' => 'Não foi possível aceitar o convite.'];
        }

        return [
            'success' => true,
            'url' => \yii\helpers\Url::to(['/nexchat/index/view', 'id' => $conversationId]),
        ];
    }

    public function actionDeclineInvite()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $conversationId = (int) Yii::$app->request->post('conversation_id', 0);
        $userId = (int) Yii::$app->user->id;

        Membership::deleteAll([
            'conversation_id' => $conversationId,
            'user_id' => $userId,
            'status' => Membership::STATUS_PENDING,
        ]);

        return ['success' => true];
    }

    public function actionRemoveMember()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $conversationId = (int) Yii::$app->request->post('conversation_id', 0);
        $userId = (int) Yii::$app->request->post('user_id', 0);
        $currentUserId = (int) Yii::$app->user->id;

        $conversation = $this->findConversation($conversationId);
        $this->assertChannelAdmin($conversation);

        $membership = $conversation->getMembership($userId);
        if ($userId <= 0 || !$membership) {
            return ['success' => false, 'error' => 'Membro não encontrado.'];
        }

        if ($userId === $currentUserId) {
            return ['success' => false, 'error' => 'Use sair do canal em vez de remover a si mesmo.'];
        }

        Membership::deleteAll(['conversation_id' => $conversation->id, 'user_id' => $userId]);

        return ['success' => true];
    }

    public function actionRenameChannel()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $conversationId = (int) Yii::$app->request->post('conversation_id', 0);
        $name = trim((string) Yii::$app->request->post('name', ''));

        $conversation = $this->findConversation($conversationId);
        $this->assertChannelAdmin($conversation);

        if ($name === '' || mb_strlen($name) > 100) {
            return ['success' => false, 'error' => 'Informe um nome válido (até 100 caracteres).'];
        }

        $conversation->name = $name;
        if (!$conversation->save()) {
            return ['success' => false, 'error' => 'Não foi possível renomear o canal.'];
        }

        return ['success' => true, 'name' => $conversation->name];
    }

    public function actionDeleteChannel()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $conversationId = (int) Yii::$app->request->post('conversation_id', 0);

        $conversation = $this->findConversation($conversationId);
        $this->assertChannelAdmin($conversation);

        if ($this->conversationHasParentColumn()) {
            foreach (Conversation::findTopics((int) $conversation->id) as $topic) {
                $topic->delete();
            }
        }

        $messageIds = Message::find()
            ->select('id')
            ->where(['conversation_id' => $conversation->id])
            ->column();

        if (!empty($messageIds)) {
            foreach (Attachment::find()->where(['message_id' => $messageIds])->all() as $attachment) {
                $attachment->delete();
            }
        }

        if (!$conversation->delete()) {
            return ['success' => false, 'error' => 'Não foi possível excluir o canal.'];
        }

        return ['success' => true, 'url' => \yii\helpers\Url::to(['/nexchat/index/index'])];
    }

    protected function buildPageData(?Conversation $activeConversation = null): array
    {
        $userId = (int) Yii::$app->user->id;

        $channelConversations = [];
        $dmConversations = [];

        foreach (Conversation::findForUser($userId) as $conversation) {
            if ($conversation->type === Conversation::TYPE_CHANNEL) {
                $channelConversations[] = $conversation;
            } else {
                $dmConversations[] = $conversation;
            }
        }

        $memberships = [];
        $isChannelAdmin = false;
        $linkedUserIds = [];

        if ($activeConversation && $activeConversation->type === Conversation::TYPE_CHANNEL) {
            $memberships = Membership::find()
                ->where(['conversation_id' => $activeConversation->id, 'status' => Membership::STATUS_ACTIVE])
                ->with('user')
                ->all();
            $isChannelAdmin = $activeConversation->isAdmin($userId);

            // Inclui membros ativos e convites pendentes para não permitir convite duplicado.
            $linkedUserIds = Membership::find()
                ->select('user_id')
                ->where(['conversation_id' => $activeConversation->id])
                ->column();
        }

        return [
            'channelConversations' => $channelConversations,
            'dmConversations' => $dmConversations,
            'pendingInvites' => Conversation::findPendingInvitesForUser($userId),
            'users' => User::find()
                ->active()
                ->where(['!=', 'id', $userId])
                ->orderBy(['username' => SORT_ASC])
                ->all(),
            'activeConversation' => $activeConversation,
            'memberships' => $memberships,
            'isChannelAdmin' => $isChannelAdmin,
            'invitableUsers' => User::find()
                ->active()
                ->where(['!=', 'id', $userId])
                ->andFilterWhere(['not in', 'id', $linkedUserIds ?: [0]])
                ->orderBy(['username' => SORT_ASC])
                ->all(),
        ];
    }

    /**
     * Monta os contatos da sidebar de mensagens diretas.
     * Lista só usuários ativos (exclui contas apagadas, desativadas e a secretária). Anexa preview da DM existente.
     * @return array<int, array{id: int, name: string, username: string, guid: string, title: string, lastPreview: string, isOnline: bool, conversationId: int|null, isSecretary: bool}>
     */
    protected function listContacts(int $userId): array
    {
        $directMessages = [];
        foreach (Conversation::findForUser($userId) as $conversation) {
            if ($conversation->type === Conversation::TYPE_DM && $conversation->dm_key) {
                $directMessages[$conversation->dm_key] = $conversation;
            }
        }

        $previews = $this->lastMessagePreviews(array_map(
            static fn(Conversation $conversation) => (int) $conversation->id,
            $directMessages,
        ));

        $viewer = User::findOne($userId);
        $restrictToFriends = NexchatFriendship::isAvailable();
        $friendIds = $restrictToFriends && $viewer instanceof User
            ? NexchatFriendship::friendIdSet($viewer)
            : [];

        $contacts = [];
        foreach (
            User::find()
                ->active()
                ->where(['!=', 'id', $userId])
                ->with('profile')
                ->orderBy(['username' => SORT_ASC])
                ->all() as $user
        ) {
            $existing = $directMessages[Conversation::buildDmKey($userId, (int) $user->id)] ?? null;
            if (KaizzenConfig::isSecretaryUser((int) $user->id)) {
                continue;
            }

            if (
                $restrictToFriends
                && $existing === null
                && !isset($friendIds[(int) $user->id])
            ) {
                continue;
            }

            $contacts[] = [
                'id' => (int) $user->id,
                'name' => $user->getDisplayName(),
                'username' => (string) $user->username,
                'guid' => (string) $user->guid,
                'title' => trim((string) ($user->profile->title ?? '')),
                'lastPreview' => $existing ? ($previews[(int) $existing->id] ?? '') : '',
                'isOnline' => $this->isUserOnline($user),
                'conversationId' => $existing ? (int) $existing->id : null,
                'isSecretary' => false,
            ];
        }

        usort($contacts, static function (array $left, array $right): int {
            return strcasecmp((string) $left['name'], (string) $right['name']);
        });

        return $contacts;
    }

    /**
     * @param int[] $conversationIds
     * @return array<int, string>
     */
    protected function lastMessagePreviews(array $conversationIds): array
    {
        if ($conversationIds === []) {
            return [];
        }

        $rows = (new \yii\db\Query())
            ->select(['conversation_id', 'MAX(id) AS max_id'])
            ->from(Message::tableName())
            ->where(['conversation_id' => $conversationIds])
            ->groupBy('conversation_id')
            ->all();

        $lastIds = array_map(static fn(array $row) => (int) $row['max_id'], $rows);
        if ($lastIds === []) {
            return [];
        }

        $previews = [];
        foreach (Message::find()->where(['id' => $lastIds])->all() as $message) {
            $previews[(int) $message->conversation_id] = $message->getPreview(48);
        }

        return $previews;
    }

    /**
     * Devolve último id e total de mensagens da conversa.
     * Usa o cache do request; na primeira falta, busca em lote.
     *
     * @return array{lastMessageId: int, messageCount: int}
     */
    private function messageStat(int $conversationId): array
    {
        $this->ensureMessageStats([$conversationId]);

        return $this->messageStats[$conversationId] ?? [
            'lastMessageId' => 0,
            'messageCount' => 0,
        ];
    }

    /**
     * Preenche o cache de lastMessageId/messageCount das conversas pedidas.
     * Uma query GROUP BY por request; ids já conhecidos são ignorados.
     *
     * @param int[] $conversationIds
     */
    private function ensureMessageStats(array $conversationIds): void
    {
        if ($this->messageStats === null) {
            $this->messageStats = [];
        }

        $missing = [];
        foreach ($conversationIds as $conversationId) {
            $id = (int) $conversationId;
            if ($id <= 0 || array_key_exists($id, $this->messageStats)) {
                continue;
            }
            $missing[] = $id;
            $this->messageStats[$id] = [
                'lastMessageId' => 0,
                'messageCount' => 0,
            ];
        }

        if ($missing === []) {
            return;
        }

        $rows = (new \yii\db\Query())
            ->select([
                'conversation_id',
                'MAX(id) AS last_id',
                'COUNT(*) AS message_count',
            ])
            ->from(Message::tableName())
            ->where(['conversation_id' => $missing])
            ->groupBy('conversation_id')
            ->all();

        foreach ($rows as $row) {
            $this->messageStats[(int) $row['conversation_id']] = [
                'lastMessageId' => (int) $row['last_id'],
                'messageCount' => (int) $row['message_count'],
            ];
        }
    }

    private function requireFriendship(int $userId, int $targetUserId): ?string
    {
        $user = User::findOne($userId);
        $target = User::findOne($targetUserId);
        if (!($user instanceof User) || !($target instanceof User)) {
            return 'Usuário inválido.';
        }

        if (NexchatFriendship::canDirectMessage($user, $target)) {
            return null;
        }

        return 'Vocês precisam ser amigos para enviar mensagem direta. Siga a pessoa em Pessoas e aguarde o aceite.';
    }

    protected function isUserOnline(User $user): bool
    {
        $lastLogin = $user->hasAttribute("last_login")
            ? $user->getAttribute("last_login")
            : null;
        if (!$lastLogin) {
            return false;
        }

        return strtotime((string) $lastLogin) >= time() - 300;
    }

    protected function registerChatAssets(?int $activeConversationId = null): void
    {
        NexchatAsset::register($this->view);
        $this->view->registerJs(
            'humhub.require("nexchat").init(' . ($activeConversationId ?: 'null') . ');',
        );
    }

    protected function assertChannelAdmin(Conversation $conversation): void
    {
        if ($conversation->type !== Conversation::TYPE_CHANNEL) {
            throw new ForbiddenHttpException('Apenas canais possuem membros gerenciáveis.');
        }

        if (!$conversation->isAdmin((int) Yii::$app->user->id)) {
            throw new ForbiddenHttpException('Somente administradores do canal podem fazer isso.');
        }
    }

    private function isVoiceChannel(Conversation $conversation): bool
    {
        return $conversation->type === Conversation::TYPE_CHANNEL
            && $this->readOptionalString($conversation, 'channel_kind') === Conversation::KIND_VOICE;
    }

    /**
     * @param int[] $conversationIds
     * @return Conversation[]|string
     */
    private function forwardDestinations(array $conversationIds)
    {
        $destinations = [];
        foreach ($conversationIds as $conversationId) {
            $conversation = $this->findConversation($conversationId);
            if ($this->isVoiceChannel($conversation)) {
                return 'Não é possível encaminhar para um canal de voz.';
            }

            $destinations[] = $conversation;
        }

        return $destinations;
    }

    private function forwardedContent(Message $source, string $comment): string
    {
        $body = $this->unwrapForwardedContent((string) $source->content);
        $authorName = $source->author->displayName ?? 'Usuário';
        $payload = json_encode(
            ['authorName' => $authorName, 'content' => $body],
            JSON_UNESCAPED_UNICODE,
        );
        $marker = 'nexhub-forward:v1:' . $payload;

        return $comment !== '' ? $comment . "\n\n" . $marker : $marker;
    }

    private function unwrapForwardedContent(string $content): string
    {
        if (preg_match('/nexhub-forward:v1:(.+)$/s', $content, $matches)) {
            $decoded = json_decode($matches[1], true);
            if (is_array($decoded) && isset($decoded['content']) && is_string($decoded['content'])) {
                return $decoded['content'];
            }
        }

        return $content;
    }

    private function copyAttachments(Message $source, Message $target): void
    {
        $basePath = Module::ensureUploadPath();
        if ($basePath === null) {
            return;
        }

        foreach ($source->attachments as $attachment) {
            $path = $attachment->getFilePath();
            if (!is_file($path)) {
                continue;
            }

            $extension = pathinfo((string) $attachment->stored_name, PATHINFO_EXTENSION);
            $storedName = bin2hex(random_bytes(16)) . ($extension !== '' ? '.' . $extension : '');
            $targetPath = $basePath . DIRECTORY_SEPARATOR . $storedName;
            if (!@copy($path, $targetPath)) {
                continue;
            }

            $copy = new Attachment([
                'message_id' => $target->id,
                'file_name' => $attachment->file_name,
                'stored_name' => $storedName,
                'mime' => $attachment->mime,
                'size' => $attachment->size,
                'is_image' => $attachment->is_image,
            ]);

            if (!$copy->save()) {
                @unlink($targetPath);
            }
        }
    }

    protected function findConversation(int $id): Conversation
    {
        $conversation = Conversation::findOne($id);
        if (!$conversation) {
            throw new NotFoundHttpException('Conversa não encontrada.');
        }

        if (!$conversation->canAccess((int) Yii::$app->user->id)) {
            throw new ForbiddenHttpException('Você não participa desta conversa.');
        }

        return $conversation;
    }

    /**
     * Busca um usuário habilitado pelo id.
     * Usa o escopo `active` do HumHub (status enabled); devolve null se o id for inválido ou a conta não estiver ativa.
     */
    /**
     * Normaliza expiresAt do OAuth para datetime SQL ou null.
     */
    private static function readOptionalDate(mixed $value): ?string
    {
        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        $timestamp = strtotime($value);
        if ($timestamp === false) {
            return null;
        }

        return date('Y-m-d H:i:s', $timestamp);
    }

    private function findActiveUser(int $userId): ?User
    {
        if ($userId <= 0) {
            return null;
        }

        $user = User::find()->active()->andWhere(['id' => $userId])->one();

        return $user instanceof User ? $user : null;
    }

    private function conversationHasParentColumn(): bool
    {
        $schema = Yii::$app->db->getTableSchema(Conversation::tableName(), true);

        return $schema !== null && $schema->getColumn('parent_id') !== null;
    }

    private function topicRoot(Conversation $conversation): Conversation
    {
        if (!$conversation->isTopic()) {
            return $conversation;
        }

        $parent = Conversation::findOne((int) $conversation->parent_id);

        return $parent ?: $conversation;
    }

    /**
     * @return array{
     *   id: int,
     *   parentConversationId: int,
     *   name: string,
     *   isPrivate: bool,
     *   lastPreview: string,
     *   lastActivityAt: string|null,
     *   messageCount: int,
     *   starterName: string,
     *   starterImageUrl: string,
     *   isJoined: bool
     * }
     */
    private function topicToItem(Conversation $topic): array
    {
        $userId = (int) Yii::$app->user->id;
        $last = Message::find()
            ->where(['conversation_id' => $topic->id])
            ->orderBy(['id' => SORT_DESC])
            ->one();
        $starter = $topic->created_by ? User::findOne((int) $topic->created_by) : null;

        return [
            'id' => (int) $topic->id,
            'parentConversationId' => (int) ($topic->parent_id ?: 0),
            'name' => $topic->getDisplayName(),
            'isPrivate' => (bool) $this->readOptionalInt($topic, 'is_private'),
            'lastPreview' => $last ? $last->getPreview(80) : '',
            'lastActivityAt' => $topic->last_message_at ?: $topic->created_at,
            'messageCount' => (int) Message::find()->where(['conversation_id' => $topic->id])->count(),
            'starterName' => $starter ? $starter->getDisplayName() : '',
            'starterImageUrl' => $starter ? Message::resolveAvatarUrl($starter) : '',
            'isJoined' => $topic->isMember($userId) || $topic->canAccess($userId),
        ];
    }

    private function saveTopicMessage(Conversation $conversation, string $content): void
    {
        $message = new Message([
            'conversation_id' => $conversation->id,
            'user_id' => (int) Yii::$app->user->id,
            'content' => $content,
        ]);

        if (!$message->save()) {
            return;
        }

        try {
            NexchatMercure::publishNewMessage($message);
        } catch (\Throwable $error) {
            Yii::error($error, 'nexchat');
        }
    }
}
