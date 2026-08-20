<?php

namespace humhub\modules\nexchat\controllers;

use humhub\components\Controller;
use humhub\modules\nexchat\assets\NexchatAsset;
use humhub\modules\nexchat\components\BearerLogin;
use humhub\modules\nexchat\components\NexchatMercure;
use humhub\modules\nexchat\Module;
use humhub\modules\nexchat\models\Attachment;
use humhub\modules\nexchat\models\Conversation;
use humhub\modules\nexchat\models\Membership;
use humhub\modules\nexchat\models\Message;
use humhub\modules\nexchat\models\Reaction;
use humhub\modules\nexchat\notifications\ChannelInvite;
use humhub\modules\nexchat\notifications\NewDmMessage;
use humhub\modules\user\models\User;
use Yii;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;
use yii\web\Response;
use yii\web\UploadedFile;

class IndexController extends Controller
{
    private const MESSAGE_PAGE_SIZE = 50;

    public function beforeAction($action)
    {
        BearerLogin::authenticate();

        if (BearerLogin::hasBearer()) {
            $this->enableCsrfValidation = false;
        }

        return parent::beforeAction($action);
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

        $toItem = static function (Conversation $conversation) {
            return [
                'id' => (int) $conversation->id,
                'type' => $conversation->type,
                'name' => $conversation->getDisplayName(),
            ];
        };

        return [
            'success' => true,
            'channels' => array_map($toItem, $data['channelConversations']),
            'dms' => array_map($toItem, $data['dmConversations']),
            'pendingInvites' => array_map($toItem, $data['pendingInvites']),
        ];
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
        if ($name === '') {
            Yii::$app->session->setFlash('error', 'Informe o nome do canal.');
            return $this->redirect(['index']);
        }

        $conversation = Conversation::createChannel($name, (int) Yii::$app->user->id);
        Yii::$app->session->setFlash('success', 'Canal criado com sucesso.');

        return $this->redirect(['view', 'id' => $conversation->id]);
    }

    public function actionStartDm()
    {
        $targetUserId = (int) Yii::$app->request->post('user_id', 0);
        if ($targetUserId <= 0) {
            Yii::$app->session->setFlash('error', 'Selecione um usuário.');
            return $this->redirect(['index']);
        }

        $conversation = Conversation::findOrCreateDm((int) Yii::$app->user->id, $targetUserId);

        return $this->redirect(['view', 'id' => $conversation->id]);
    }

    public function actionOpenDm()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $targetUserId = (int) Yii::$app->request->post('user_id', 0);
        if ($targetUserId <= 0 || $targetUserId === (int) Yii::$app->user->id) {
            return ['success' => false, 'error' => 'Usuário inválido.'];
        }

        $conversation = Conversation::findOrCreateDm((int) Yii::$app->user->id, $targetUserId);

        return [
            'success' => true,
            'url' => \yii\helpers\Url::to(['/nexchat/index/view', 'id' => $conversation->id]),
        ];
    }

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

        $this->notifyRecipients($conversation, $message);

        return [
            'success' => true,
            'message' => $message->toPayload(),
            'warnings' => $errors,
        ];
    }

    protected function notifyRecipients(Conversation $conversation, Message $message): void
    {
        if ($conversation->type !== Conversation::TYPE_DM) {
            return;
        }

        $author = Yii::$app->user->identity;
        if (!$author) {
            return;
        }

        foreach ($conversation->members as $member) {
            if ((int) $member->id === (int) $author->id) {
                continue;
            }

            try {
                NewDmMessage::instance()
                    ->from($author)
                    ->about($message)
                    ->send($member);
            } catch (\Throwable $e) {
                Yii::error($e, 'nexchat');
            }
        }
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

        $mime = (string) ($uploadedFile->type ?: 'application/octet-stream');
        $storedName = bin2hex(random_bytes(16)) . '.' . $extension;
        $targetPath = Module::uploadBasePath() . DIRECTORY_SEPARATOR . $storedName;

        if (!$uploadedFile->saveAs($targetPath)) {
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
        if (!$conversation || !$conversation->isMember((int) Yii::$app->user->id)) {
            throw new ForbiddenHttpException('Você não tem acesso a este arquivo.');
        }

        $path = $attachment->getFilePath();
        if (!is_file($path)) {
            throw new NotFoundHttpException('Arquivo indisponível.');
        }

        $inline = $attachment->is_image || $attachment->mime === 'application/pdf';

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

    public function actionUpdates()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $userId = (int) Yii::$app->user->id;
        $items = [];

        foreach (Conversation::findForUser($userId) as $conversation) {
            $lastMessage = Message::find()
                ->where(['conversation_id' => $conversation->id])
                ->orderBy(['id' => SORT_DESC])
                ->one();

            $items[] = [
                'id' => (int) $conversation->id,
                'type' => $conversation->type,
                'name' => $conversation->getDisplayName(),
                'lastMessageId' => $lastMessage ? (int) $lastMessage->id : 0,
                'preview' => $lastMessage ? mb_substr($lastMessage->content, 0, 80) : '',
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

        if ($userId <= 0 || !$conversation->isMember($userId)) {
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
            'users' => User::find()->where(['!=', 'id', $userId])->orderBy(['username' => SORT_ASC])->all(),
            'activeConversation' => $activeConversation,
            'memberships' => $memberships,
            'isChannelAdmin' => $isChannelAdmin,
            'invitableUsers' => User::find()
                ->where(['!=', 'id', $userId])
                ->andFilterWhere(['not in', 'id', $linkedUserIds ?: [0]])
                ->orderBy(['username' => SORT_ASC])
                ->all(),
        ];
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

    protected function findConversation(int $id): Conversation
    {
        $conversation = Conversation::findOne($id);
        if (!$conversation) {
            throw new NotFoundHttpException('Conversa não encontrada.');
        }

        if (!$conversation->isMember((int) Yii::$app->user->id)) {
            throw new ForbiddenHttpException('Você não participa desta conversa.');
        }

        return $conversation;
    }
}
