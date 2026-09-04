<?php

namespace humhub\modules\nexchat\models;

use humhub\components\ActiveRecord;
use humhub\modules\nexchat\components\KaizzenConfig;
use humhub\modules\space\models\Membership as SpaceMembership;
use humhub\modules\user\models\User;
use Yii;

/**
 * @property int $id
 * @property string $type dm|channel
 * @property string|null $name
 * @property int|null $space_id
 * @property int|null $parent_id
 * @property string|null $channel_kind text|voice|forum
 * @property int $is_private
 * @property string|null $topic
 * @property int $slow_mode_seconds
 * @property string|null $dm_key
 * @property string|null $last_message_at
 * @property string|null $created_at
 * @property int|null $created_by
 * @property string|null $updated_at
 * @property int|null $updated_by
 *
 * @property-read Membership[] $memberships
 * @property-read Message[] $messages
 * @property-read User[] $members
 */
class Conversation extends ActiveRecord
{
    public const TYPE_DM = 'dm';
    public const TYPE_CHANNEL = 'channel';
    public const TYPE_SECRETARY = 'secretary';
    public const KIND_TEXT = 'text';
    public const KIND_VOICE = 'voice';
    public const KIND_FORUM = 'forum';

    public static function tableName()
    {
        return 'nexchat_conversation';
    }

    public function rules()
    {
        return [
            [['type'], 'required'],
            [['type'], 'in', 'range' => [self::TYPE_DM, self::TYPE_CHANNEL, self::TYPE_SECRETARY]],
            [['channel_kind'], 'in', 'range' => self::channelKinds()],
            [['space_id', 'parent_id'], 'integer'],
            [['is_private'], 'boolean'],
            [['slow_mode_seconds'], 'integer', 'min' => 0],
            [['name'], 'string', 'max' => 100],
            [['topic'], 'string', 'max' => 1024],
            [['dm_key'], 'string', 'max' => 50],
            [['name'], 'required', 'when' => fn(self $model) => $model->type === self::TYPE_CHANNEL],
            [['last_message_at'], 'safe'],
        ];
    }

    public function getMemberships()
    {
        return $this->hasMany(Membership::class, ['conversation_id' => 'id']);
    }

    public function getMessages()
    {
        return $this->hasMany(Message::class, ['conversation_id' => 'id'])
            ->orderBy(['created_at' => SORT_ASC]);
    }

    public function getMembers()
    {
        return $this->hasMany(User::class, ['id' => 'user_id'])
            ->via('memberships');
    }

    public function getDisplayName(?User $viewer = null): string
    {
        if ($this->type === self::TYPE_CHANNEL) {
            return $this->name ?: Yii::t('NexchatModule.base', 'Canal sem nome');
        }

        if ($this->isSecretaryThread()) {
            return 'Secretária';
        }

        $viewer = $viewer ?: Yii::$app->user->identity;
        foreach ($this->members as $member) {
            if ($viewer && (int) $member->id !== (int) $viewer->id) {
                return $member->displayName;
            }
        }

        return Yii::t('NexchatModule.base', 'Conversa direta');
    }

    public static function buildDmKey(int $userA, int $userB): string
    {
        $ids = [(int) $userA, (int) $userB];
        sort($ids);

        return $ids[0] . '_' . $ids[1];
    }

    public static function findOrCreateDm(int $userA, int $userB): Conversation
    {
        $dmKey = self::buildDmKey($userA, $userB);
        $conversation = self::findOne(['type' => self::TYPE_DM, 'dm_key' => $dmKey]);

        if ($conversation) {
            return $conversation;
        }

        $conversation = new self([
            'type' => self::TYPE_DM,
            'dm_key' => $dmKey,
        ]);
        $conversation->save();

        Membership::addMember($conversation->id, $userA);
        Membership::addMember($conversation->id, $userB);

        return $conversation;
    }

    /**
     * Abre ou cria a conversa de sistema da secretária deste usuário.
     * Só o dono é membro; não existe usuário HumHub do outro lado.
     */
    public static function findOrCreateSecretary(int $userId): Conversation
    {
        self::ensureSecretaryType();
        $dmKey = self::secretaryKey($userId);
        $conversation = self::findOne(['type' => self::TYPE_SECRETARY, 'dm_key' => $dmKey]);
        if ($conversation) {
            return $conversation;
        }

        $conversation = new self([
            'type' => self::TYPE_SECRETARY,
            'name' => 'Secretária',
            'dm_key' => $dmKey,
        ]);
        $conversation->save();
        Membership::addMember($conversation->id, $userId);

        return $conversation;
    }

    /**
     * Chave única da conversa da secretária por usuário.
     */
    public static function secretaryKey(int $userId): string
    {
        return 'secretary:' . (int) $userId;
    }

    /**
     * Garante que o ENUM de type aceita secretary.
     * Altera a coluna se a migration ainda não rodou.
     */
    public static function ensureSecretaryType(): void
    {
        $schema = Yii::$app->db->getTableSchema(self::tableName(), true);
        $column = $schema?->getColumn('type');
        if ($column === null || str_contains(strtolower((string) $column->dbType), 'secretary')) {
            return;
        }

        $table = Yii::$app->db->quoteTableName(self::tableName());
        Yii::$app->db->createCommand(
            "ALTER TABLE {$table} MODIFY `type` ENUM('dm','channel','secretary') NOT NULL",
        )->execute();
        Yii::$app->db->getSchema()->refreshTableSchema(self::tableName());
    }

    /**
     * Diz se esta conversa é o fio da secretária (tipo novo ou DM antiga com o user 7).
     */
    public function isSecretaryThread(): bool
    {
        if ($this->type === self::TYPE_SECRETARY) {
            return true;
        }

        if ($this->type !== self::TYPE_DM) {
            return false;
        }

        foreach ($this->members as $member) {
            if (KaizzenConfig::isSecretaryUser((int) $member->id)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Dono humano da conversa da secretária.
     * Lê o id na chave secretary:N ou o membro que não é o user legado.
     */
    public function secretaryOwnerId(): int
    {
        if (preg_match('/^secretary:(\d+)$/', (string) $this->dm_key, $match)) {
            return (int) $match[1];
        }

        foreach ($this->members as $member) {
            if (!KaizzenConfig::isSecretaryUser((int) $member->id)) {
                return (int) $member->id;
            }
        }

        return 0;
    }

    /**
     * @return string[]
     */
    public static function channelKinds(): array
    {
        return [self::KIND_TEXT, self::KIND_VOICE, self::KIND_FORUM];
    }

    public static function createChannel(
        string $name,
        int $creatorId,
        ?int $spaceId = null,
        string $channelKind = self::KIND_TEXT,
        bool $isPrivate = false,
    ): Conversation {
        $conversation = new self([
            'type' => self::TYPE_CHANNEL,
            'name' => trim($name),
            'space_id' => $spaceId,
            'channel_kind' => in_array($channelKind, self::channelKinds(), true)
                ? $channelKind
                : self::KIND_TEXT,
            'is_private' => $isPrivate ? 1 : 0,
        ]);
        $conversation->save();

        Membership::addMember($conversation->id, $creatorId, Membership::ROLE_ADMIN);

        return $conversation;
    }

    public static function createTopic(
        self $parent,
        string $name,
        int $creatorId,
        bool $isPrivate = false,
    ): Conversation {
        $conversation = new self([
            'type' => self::TYPE_CHANNEL,
            'name' => trim($name),
            'space_id' => $parent->space_id,
            'parent_id' => (int) $parent->id,
            'channel_kind' => self::KIND_TEXT,
            'is_private' => $isPrivate ? 1 : 0,
        ]);
        $conversation->save();

        Membership::addMember($conversation->id, $creatorId, Membership::ROLE_ADMIN);

        return $conversation;
    }

    /**
     * @return Conversation[]
     */
    public static function findTopics(int $parentId): array
    {
        if (!(new self())->hasAttribute('parent_id')) {
            return [];
        }

        return self::find()
            ->where([
                'parent_id' => $parentId,
                'type' => self::TYPE_CHANNEL,
            ])
            ->orderBy(['last_message_at' => SORT_DESC, 'id' => SORT_DESC])
            ->all();
    }

    public function isTopic(): bool
    {
        return $this->hasAttribute('parent_id') && (int) ($this->parent_id ?: 0) > 0;
    }

    public function isMember(int $userId): bool
    {
        return Membership::find()
            ->where([
                'conversation_id' => $this->id,
                'user_id' => $userId,
                'status' => Membership::STATUS_ACTIVE,
            ])
            ->exists();
    }

    /**
     * Diz se o usuário pode abrir esta conversa.
     * Exige membership (ou canal aberto do espaço) e, em DM, o outro participante ativo.
     */
    public function canAccess(int $userId): bool
    {
        if (!$this->isMember($userId) && !$this->isOpenToSpaceMember($userId)) {
            return false;
        }

        return $this->hasActivePeer($userId);
    }

    /**
     * Diz se a DM ainda tem o outro participante habilitado.
     * Canal sempre passa; na DM, o peer precisa existir com status ativo no HumHub.
     */
    public function hasActivePeer(int $viewerId): bool
    {
        if ($this->type !== self::TYPE_DM) {
            return true;
        }

        if ($this->isSecretaryThread()) {
            return true;
        }

        $peerId = $this->peerUserId($viewerId);
        if ($peerId === null) {
            return false;
        }

        return User::find()->active()->andWhere(['id' => $peerId])->exists();
    }

    /**
     * Devolve o id do outro participante da DM a partir da chave `a_b`.
     * @return int|null id do peer, ou null quando a chave não tem outro usuário.
     */
    public function peerUserId(int $viewerId): ?int
    {
        foreach (explode('_', (string) $this->dm_key) as $part) {
            $id = (int) $part;
            if ($id > 0 && $id !== $viewerId) {
                return $id;
            }
        }

        return null;
    }

    public function isOpenToSpaceMember(int $userId): bool
    {
        if (!$this->isOpenSpaceChannel()) {
            return false;
        }

        return SpaceMembership::find()
            ->where([
                'space_id' => (int) $this->space_id,
                'user_id' => $userId,
                'status' => SpaceMembership::STATUS_MEMBER,
            ])
            ->exists();
    }

    public function isOpenSpaceChannel(): bool
    {
        return $this->type === self::TYPE_CHANNEL
            && (int) $this->is_private !== 1
            && (int) ($this->space_id ?: 0) > 0;
    }

    public function isAdmin(int $userId): bool
    {
        return Membership::find()
            ->where([
                'conversation_id' => $this->id,
                'user_id' => $userId,
                'role' => Membership::ROLE_ADMIN,
                'status' => Membership::STATUS_ACTIVE,
            ])
            ->exists();
    }

    public function getMembership(int $userId): ?Membership
    {
        return Membership::findOne(['conversation_id' => $this->id, 'user_id' => $userId]);
    }

    public function getLastMessageId(): int
    {
        return (int) Message::find()
            ->where(['conversation_id' => $this->id])
            ->max('id');
    }

    /**
     * Lista conversas visíveis do usuário (canais e DMs).
     * Inclui membership ativa e canais abertos do espaço; omite DMs cujo peer foi excluído ou desativado.
     * @return Conversation[]
     */
    public static function findForUser(int $userId): array
    {
        $query = self::find()->where([
            'id' => Membership::find()
                ->select('conversation_id')
                ->where([
                    'user_id' => $userId,
                    'status' => Membership::STATUS_ACTIVE,
                ]),
        ]);

        $spaceIds = self::spaceIdsForUser($userId);
        if ($spaceIds !== []) {
            $query->orWhere([
                'and',
                ['type' => self::TYPE_CHANNEL],
                ['space_id' => $spaceIds],
                ['or', ['is_private' => 0], ['is_private' => null]],
            ]);
        }

        $conversations = $query
            ->orderBy(['last_message_at' => SORT_DESC, 'id' => SORT_DESC])
            ->all();

        return array_values(array_filter(
            $conversations,
            static fn(self $conversation) => $conversation->hasActivePeer($userId),
        ));
    }

    /**
     * @return int[]
     */
    private static function spaceIdsForUser(int $userId): array
    {
        return array_map(
            'intval',
            SpaceMembership::find()
                ->select('space_id')
                ->where([
                    'user_id' => $userId,
                    'status' => SpaceMembership::STATUS_MEMBER,
                ])
                ->column(),
        );
    }

    /**
     * Canais com convite pendente para o usuário (ainda não aceitos).
     *
     * @return Conversation[]
     */
    public static function findPendingInvitesForUser(int $userId): array
    {
        return self::find()
            ->innerJoin('nexchat_membership m', 'm.conversation_id = nexchat_conversation.id')
            ->where([
                'm.user_id' => $userId,
                'm.status' => Membership::STATUS_PENDING,
                'nexchat_conversation.type' => self::TYPE_CHANNEL,
            ])
            ->orderBy(['nexchat_conversation.id' => SORT_DESC])
            ->all();
    }
}
