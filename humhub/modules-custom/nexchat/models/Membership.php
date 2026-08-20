<?php

namespace humhub\modules\nexchat\models;

use humhub\components\ActiveRecord;
use humhub\modules\user\models\User;

/**
 * @property int $id
 * @property int $conversation_id
 * @property int $user_id
 * @property string $role member|admin
 * @property string $status active|pending
 * @property string|null $joined_at
 *
 * @property-read Conversation $conversation
 * @property-read User $user
 */
class Membership extends ActiveRecord
{
    public const ROLE_MEMBER = 'member';
    public const ROLE_ADMIN = 'admin';

    public const STATUS_ACTIVE = 'active';
    public const STATUS_PENDING = 'pending';

    public static function tableName()
    {
        return 'nexchat_membership';
    }

    public function rules()
    {
        return [
            [['conversation_id', 'user_id'], 'required'],
            [['conversation_id', 'user_id'], 'integer'],
            [['role'], 'in', 'range' => [self::ROLE_MEMBER, self::ROLE_ADMIN]],
            [['status'], 'in', 'range' => [self::STATUS_ACTIVE, self::STATUS_PENDING]],
            [['joined_at'], 'safe'],
        ];
    }

    public function getConversation()
    {
        return $this->hasOne(Conversation::class, ['id' => 'conversation_id']);
    }

    public function getUser()
    {
        return $this->hasOne(User::class, ['id' => 'user_id']);
    }

    public static function addMember(int $conversationId, int $userId, string $role = self::ROLE_MEMBER): self
    {
        $membership = self::findOne(['conversation_id' => $conversationId, 'user_id' => $userId]);
        if ($membership) {
            if ($membership->status !== self::STATUS_ACTIVE) {
                $membership->status = self::STATUS_ACTIVE;
                $membership->joined_at = date('Y-m-d H:i:s');
                $membership->save();
            }

            return $membership;
        }

        $membership = new self([
            'conversation_id' => $conversationId,
            'user_id' => $userId,
            'role' => $role,
            'status' => self::STATUS_ACTIVE,
            'joined_at' => date('Y-m-d H:i:s'),
        ]);
        $membership->save();

        return $membership;
    }

    /**
     * Cria um convite pendente (não dá acesso até o usuário aceitar).
     * Retorna o vínculo existente caso já exista.
     */
    public static function invite(int $conversationId, int $userId): self
    {
        $membership = self::findOne(['conversation_id' => $conversationId, 'user_id' => $userId]);
        if ($membership) {
            return $membership;
        }

        $membership = new self([
            'conversation_id' => $conversationId,
            'user_id' => $userId,
            'role' => self::ROLE_MEMBER,
            'status' => self::STATUS_PENDING,
        ]);
        $membership->save();

        return $membership;
    }
}
