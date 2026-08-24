<?php

namespace humhub\modules\nexchat\models;

use humhub\components\ActiveRecord;
use humhub\modules\user\models\User;
use Yii;

/**
 * @property int $id
 * @property int $user_id
 * @property int $space_id
 * @property string $level all|mentions|nothing
 * @property string|null $muted_until
 * @property string|null $updated_at
 */
class ServerNotificationPreference extends ActiveRecord
{
    public const LEVEL_ALL = 'all';
    public const LEVEL_MENTIONS = 'mentions';
    public const LEVEL_NOTHING = 'nothing';
    public const DEFAULT_LEVEL = self::LEVEL_MENTIONS;
    public const MUTE_UNTIL_ON = '2099-12-31 23:59:59';

    public const MUTE_MINUTES = [
        '15m' => 15,
        '1h' => 60,
        '3h' => 180,
        '8h' => 480,
        '24h' => 1440,
        'untilOn' => null,
    ];

    public static function tableName()
    {
        return 'nexchat_server_notification';
    }

    public function rules()
    {
        return [
            [['user_id', 'space_id'], 'required'],
            [['user_id', 'space_id'], 'integer'],
            [['space_id'], 'integer', 'min' => 0],
            [['level'], 'in', 'range' => self::levels()],
            [['muted_until', 'updated_at'], 'safe'],
        ];
    }

    /**
     * @return string[]
     */
    public static function levels(): array
    {
        return [self::LEVEL_ALL, self::LEVEL_MENTIONS, self::LEVEL_NOTHING];
    }

    public static function forUser(int $userId, int $spaceId): self
    {
        $preference = self::findOne(['user_id' => $userId, 'space_id' => $spaceId]);
        if ($preference) {
            return $preference;
        }

        return self::defaultFor($userId, $spaceId);
    }

    public static function defaultFor(int $userId, int $spaceId): self
    {
        return new self([
            'user_id' => $userId,
            'space_id' => $spaceId,
            'level' => self::DEFAULT_LEVEL,
            'muted_until' => null,
        ]);
    }

    public static function tableExists(): bool
    {
        return Yii::$app->db->getTableSchema(self::tableName(), true) !== null;
    }

    public function isMuted(): bool
    {
        if (!$this->muted_until) {
            return false;
        }

        $until = strtotime((string) $this->muted_until);

        return $until !== false && $until > time();
    }

    public function shouldNotify(bool $isMentioned): bool
    {
        if ($this->isMuted() || $this->level === self::LEVEL_NOTHING) {
            return false;
        }

        if ($this->level === self::LEVEL_MENTIONS) {
            return $isMentioned;
        }

        return true;
    }

    public function applyLevel(?string $level): void
    {
        if ($level !== null && in_array($level, self::levels(), true)) {
            $this->level = $level;
        }
    }

    public function applyMute(null|string $muteDuration, bool $hasMute): void
    {
        if (!$hasMute) {
            return;
        }

        if ($muteDuration === null) {
            $this->muted_until = null;
            return;
        }

        if (!array_key_exists($muteDuration, self::MUTE_MINUTES)) {
            return;
        }

        $minutes = self::MUTE_MINUTES[$muteDuration];
        $this->muted_until = $minutes === null
            ? self::MUTE_UNTIL_ON
            : date('Y-m-d H:i:s', time() + ($minutes * 60));
    }

    public function persist(): bool
    {
        if (!self::tableExists()) {
            return false;
        }

        $this->updated_at = date('Y-m-d H:i:s');

        return $this->save();
    }

    /**
     * @return array{spaceId: int, level: string, mutedUntil: ?string, isMuted: bool}
     */
    public static function emptyPayload(int $spaceId): array
    {
        return [
            'spaceId' => $spaceId,
            'level' => self::DEFAULT_LEVEL,
            'mutedUntil' => null,
            'isMuted' => false,
        ];
    }

    /**
     * @return array{spaceId: int, level: string, mutedUntil: ?string, isMuted: bool}
     */
    public function toPayload(): array
    {
        return [
            'spaceId' => (int) $this->space_id,
            'level' => in_array($this->level, self::levels(), true)
                ? $this->level
                : self::DEFAULT_LEVEL,
            'mutedUntil' => $this->mutedUntilIso(),
            'isMuted' => $this->isMuted(),
        ];
    }

    public static function mentionsUser(string $content, User $user): bool
    {
        if (preg_match('/@(everyone|aqui|todos)\b/iu', $content)) {
            return true;
        }

        foreach (array_filter([$user->username, $user->displayName]) as $needle) {
            if (preg_match('/@' . preg_quote((string) $needle, '/') . '\b/iu', $content)) {
                return true;
            }
        }

        return false;
    }

    private function mutedUntilIso(): ?string
    {
        if (!$this->muted_until || !$this->isMuted()) {
            return null;
        }

        $timestamp = strtotime((string) $this->muted_until);

        return $timestamp ? date('c', $timestamp) : null;
    }
}
