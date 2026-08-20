<?php

namespace humhub\modules\nexchat\models;

use humhub\components\ActiveRecord;
use humhub\modules\user\models\User;
use Yii;

/**
 * @property int $id
 * @property int $conversation_id
 * @property int $user_id
 * @property int|null $reply_to_id
 * @property string $content
 * @property string|null $edited_at
 * @property string|null $deleted_at
 * @property int|null $deleted_by
 * @property string|null $created_at
 * @property int|null $created_by
 * @property string|null $updated_at
 * @property int|null $updated_by
 *
 * @property-read Conversation $conversation
 * @property-read User $author
 */
class Message extends ActiveRecord
{
    public const EDIT_WINDOW_SECONDS = 3600;

    public static function tableName()
    {
        return 'nexchat_message';
    }

    public function rules()
    {
        return [
            [['conversation_id', 'user_id'], 'required'],
            [['conversation_id', 'user_id'], 'integer'],
            [['content'], 'string', 'max' => 5000],
            [['content'], 'default', 'value' => ''],
        ];
    }

    public function getConversation()
    {
        return $this->hasOne(Conversation::class, ['id' => 'conversation_id']);
    }

    public function getAuthor()
    {
        return $this->hasOne(User::class, ['id' => 'user_id']);
    }

    public function getReplyTo()
    {
        return $this->hasOne(Message::class, ['id' => 'reply_to_id']);
    }

    public function getAttachments()
    {
        return $this->hasMany(Attachment::class, ['message_id' => 'id'])
            ->orderBy(['id' => SORT_ASC]);
    }

    public function getReactions()
    {
        return $this->hasMany(Reaction::class, ['message_id' => 'id'])
            ->orderBy(['id' => SORT_ASC]);
    }

    public function afterSave($insert, $changedAttributes)
    {
        parent::afterSave($insert, $changedAttributes);

        if ($insert && $this->conversation) {
            $this->conversation->last_message_at = $this->created_at ?: date('Y-m-d H:i:s');
            $this->conversation->save(false, ['last_message_at']);
        }
    }

    public function isDeleted(): bool
    {
        return $this->deleted_at !== null;
    }

    public function toPayload(): array
    {
        $currentUserId = Yii::$app->user->isGuest ? 0 : (int) Yii::$app->user->id;
        $deleted = $this->isDeleted();

        return [
            'id' => (int) $this->id,
            'userId' => (int) $this->user_id,
            'authorName' => $this->author->displayName ?? 'Usuário',
            'avatarUrl' => self::resolveAvatarUrl($this->author),
            'content' => $deleted ? '' : ($this->content ?? ''),
            'createdAt' => $this->created_at,
            'createdAtTs' => $this->created_at ? strtotime($this->created_at) : time(),
            'editedAt' => $deleted ? null : $this->edited_at,
            'deleted' => $deleted,
            'attachments' => $deleted ? [] : array_map(
                static fn(Attachment $attachment) => $attachment->toPayload(),
                $this->attachments,
            ),
            'reactions' => $deleted ? [] : Reaction::aggregate($this->reactions, $currentUserId),
            'replyTo' => (!$deleted && $this->reply_to_id && $this->replyTo) ? [
                'id' => (int) $this->replyTo->id,
                'authorName' => $this->replyTo->author->displayName ?? 'Usuário',
                'avatarUrl' => self::resolveAvatarUrl($this->replyTo->author),
                'preview' => $this->replyTo->getPreview(),
            ] : null,
        ];
    }

    public function isWithinEditWindow(): bool
    {
        $createdTs = $this->created_at ? strtotime($this->created_at) : 0;

        return $createdTs > 0 && (time() - $createdTs) <= self::EDIT_WINDOW_SECONDS;
    }

    public function getPreview(int $length = 80): string
    {
        if ($this->isDeleted()) {
            return 'Mensagem excluída';
        }

        $text = trim((string) $this->content);
        if ($text !== '') {
            return mb_substr($text, 0, $length);
        }

        if (!empty($this->attachments)) {
            return '📎 Anexo';
        }

        return '';
    }

    public static function resolveAvatarUrl(?User $user): string
    {
        if (!$user) {
            return '';
        }

        try {
            return $user->getProfileImage()->getUrl('', true);
        } catch (\Throwable $e) {
            return '';
        }
    }
}
