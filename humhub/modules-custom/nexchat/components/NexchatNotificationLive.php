<?php

namespace humhub\modules\nexchat\components;

use humhub\modules\notification\models\Notification;
use humhub\modules\user\models\User;
use Yii;

class NexchatNotificationLive
{
    public static function publishFromRecord(object $record): void
    {
        if (!$record instanceof Notification) {
            return;
        }

        $userId = (int) $record->user_id;
        if ($userId <= 0 || (int) $record->seen === 1) {
            return;
        }

        if (isset($record->send_web_notifications) && !(int) $record->send_web_notifications) {
            return;
        }

        try {
            NexchatMercure::publishNotificationEvent($userId, [
                'type' => 'nexchat.newNotification',
                'unseenCount' => self::countUnseen($userId),
                'notification' => self::toPayload($record),
            ]);
        } catch (\Throwable $error) {
            Yii::warning($error->getMessage(), 'nexchat');
        }
    }

    private static function countUnseen(int $userId): int
    {
        return (int) Notification::find()
            ->where(['user_id' => $userId, 'seen' => 0])
            ->count();
    }

    /**
     * @return array{id: int, text: string, originatorName: ?string, originatorImageUrl: string, publishedAt: ?string, isUnseen: bool}
     */
    private static function toPayload(Notification $record): array
    {
        $originator = self::originatorOf($record);

        return [
            'id' => (int) $record->id,
            'text' => self::notificationText($record),
            'originatorName' => $originator?->displayName ?: null,
            'originatorImageUrl' => self::originatorImageUrl($originator),
            'publishedAt' => self::publishedAt($record),
            'isUnseen' => true,
        ];
    }

    private static function notificationText(Notification $record): string
    {
        try {
            $base = $record->getBaseModel();
            if (!is_object($base)) {
                return 'Nova notificação';
            }

            $text = self::plainText($base);
            if ($text !== '') {
                return $text;
            }
        } catch (\Throwable $error) {
            Yii::warning($error->getMessage(), 'nexchat');
        }

        return 'Nova notificação';
    }

    private static function plainText(object $base): string
    {
        if (method_exists($base, 'text')) {
            $text = trim(strip_tags((string) $base->text()));
            if ($text !== '') {
                return $text;
            }
        }

        if (method_exists($base, 'html')) {
            return trim(strip_tags((string) $base->html()));
        }

        return '';
    }

    private static function originatorOf(Notification $record): ?User
    {
        try {
            $originator = $record->originator ?? null;
            return $originator instanceof User ? $originator : null;
        } catch (\Throwable $error) {
            Yii::warning($error->getMessage(), 'nexchat');
            return null;
        }
    }

    private static function originatorImageUrl(?User $originator): string
    {
        if (!$originator) {
            return '';
        }

        try {
            return (string) $originator->getProfileImage()->getUrl('', true);
        } catch (\Throwable $error) {
            Yii::warning($error->getMessage(), 'nexchat');

            return '';
        }
    }

    private static function publishedAt(Notification $record): ?string
    {
        if (empty($record->created_at)) {
            return null;
        }

        $timestamp = strtotime((string) $record->created_at);

        return $timestamp ? date('c', $timestamp) : null;
    }
}
