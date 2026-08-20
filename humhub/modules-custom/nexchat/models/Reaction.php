<?php

namespace humhub\modules\nexchat\models;

use humhub\components\ActiveRecord;
use humhub\modules\user\models\User;

/**
 * @property int $id
 * @property int $message_id
 * @property int $user_id
 * @property string $emoji
 * @property string|null $created_at
 *
 * @property-read Message $message
 * @property-read User $user
 */
class Reaction extends ActiveRecord
{
    public static function tableName()
    {
        return 'nexchat_reaction';
    }

    public function rules()
    {
        return [
            [['message_id', 'user_id', 'emoji'], 'required'],
            [['message_id', 'user_id'], 'integer'],
            [['emoji'], 'string', 'max' => 32],
            [['created_at'], 'safe'],
        ];
    }

    public function getMessage()
    {
        return $this->hasOne(Message::class, ['id' => 'message_id']);
    }

    public function getUser()
    {
        return $this->hasOne(User::class, ['id' => 'user_id']);
    }

    /**
     * Aggregates reactions of a message into pills grouped by emoji.
     *
     * @param Reaction[] $reactions
     */
    public static function aggregate(array $reactions, int $currentUserId): array
    {
        $groups = [];

        foreach ($reactions as $reaction) {
            $emoji = $reaction->emoji;
            if (!isset($groups[$emoji])) {
                $groups[$emoji] = [
                    'emoji' => $emoji,
                    'count' => 0,
                    'mine' => false,
                    'userIds' => [],
                    'users' => [],
                ];
            }

            $groups[$emoji]['count']++;
            $groups[$emoji]['userIds'][] = (int) $reaction->user_id;
            if ((int) $reaction->user_id === $currentUserId) {
                $groups[$emoji]['mine'] = true;
            }

            $name = $reaction->user->displayName ?? null;
            if ($name && count($groups[$emoji]['users']) < 20) {
                $groups[$emoji]['users'][] = $name;
            }
        }

        return array_values($groups);
    }
}
