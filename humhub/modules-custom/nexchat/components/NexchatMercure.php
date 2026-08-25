<?php

namespace humhub\modules\nexchat\components;

use Firebase\JWT\JWT;
use humhub\modules\live\driver\MercurePushDriver;
use humhub\modules\nexchat\models\Message;
use Symfony\Component\HttpClient\CurlHttpClient;
use Symfony\Component\Mercure\Hub;
use Symfony\Component\Mercure\Jwt\FactoryTokenProvider;
use Symfony\Component\Mercure\Jwt\LcobucciFactory;
use Symfony\Component\Mercure\Update;
use Yii;
use yii\helpers\Url;

class NexchatMercure
{
    public const TOPIC_PREFIX = '/humhub/nexchat/conversation/';

    public const TOPIC_NOTIFICATION_PREFIX = '/humhub/nexchat/notification/';

    public const TOPIC_VOICE_PREFIX = '/humhub/nexchat/voice/';

    public static function getTopic(int $conversationId): string
    {
        return self::TOPIC_PREFIX . $conversationId;
    }

    public static function getNotificationTopic(int $userId): string
    {
        return self::TOPIC_NOTIFICATION_PREFIX . $userId;
    }

    public static function getVoiceTopic(int $userId): string
    {
        return self::TOPIC_VOICE_PREFIX . $userId;
    }

    public static function publishNewMessage(Message $message): void
    {
        $driver = self::getDriver();
        if (!$driver) {
            return;
        }

        $payload = json_encode([
            'type' => 'nexchat.newMessage',
            'conversationId' => (int) $message->conversation_id,
            'message' => $message->toPayload(),
        ]);

        $hub = self::createPublisherHub($driver);
        $hub->publish(new Update(self::getTopic((int) $message->conversation_id), $payload, true));
    }

    public static function publishMessageEdit(Message $message): void
    {
        $driver = self::getDriver();
        if (!$driver) {
            return;
        }

        $payload = json_encode([
            'type' => 'nexchat.editMessage',
            'conversationId' => (int) $message->conversation_id,
            'message' => $message->toPayload(),
        ]);

        $hub = self::createPublisherHub($driver);
        $hub->publish(new Update(self::getTopic((int) $message->conversation_id), $payload, true));
    }

    public static function publishMessageDelete(Message $message): void
    {
        $driver = self::getDriver();
        if (!$driver) {
            return;
        }

        $payload = json_encode([
            'type' => 'nexchat.deleteMessage',
            'conversationId' => (int) $message->conversation_id,
            'messageId' => (int) $message->id,
            'message' => $message->toPayload(),
        ]);

        $hub = self::createPublisherHub($driver);
        $hub->publish(new Update(self::getTopic((int) $message->conversation_id), $payload, true));
    }

    public static function publishReaction(int $conversationId, int $messageId, array $reactions): void
    {
        $driver = self::getDriver();
        if (!$driver) {
            return;
        }

        $payload = json_encode([
            'type' => 'nexchat.reaction',
            'conversationId' => $conversationId,
            'messageId' => $messageId,
            'reactions' => $reactions,
        ]);

        $hub = self::createPublisherHub($driver);
        $hub->publish(new Update(self::getTopic($conversationId), $payload, true));
    }

    public static function publishTyping(
        int $conversationId,
        int $userId,
        string $userName,
        bool $isTyping,
    ): void {
        $driver = self::getDriver();
        if (!$driver || $conversationId <= 0 || $userId <= 0) {
            return;
        }

        $payload = json_encode([
            'type' => 'nexchat.typing',
            'conversationId' => $conversationId,
            'userId' => $userId,
            'userName' => $userName,
            'isTyping' => $isTyping,
        ]);

        $hub = self::createPublisherHub($driver);
        $hub->publish(new Update(self::getTopic($conversationId), $payload, true));
    }

    public static function publishNotificationEvent(int $userId, array $payload): void
    {
        $driver = self::getDriver();
        if (!$driver || $userId <= 0) {
            return;
        }

        $hub = self::createPublisherHub($driver);
        $hub->publish(new Update(
            self::getNotificationTopic($userId),
            json_encode($payload),
            true,
        ));
    }

    /**
     * @param int[] $userIds
     */
    public static function publishVoiceOccupancy(array $userIds, array $payload): void
    {
        $driver = self::getDriver();
        if (!$driver) {
            return;
        }

        $ids = array_values(array_unique(array_filter(
            array_map('intval', $userIds),
            static fn(int $userId) => $userId > 0,
        )));
        if ($ids === []) {
            return;
        }

        $hub = self::createPublisherHub($driver);
        $body = json_encode($payload);
        foreach ($ids as $userId) {
            $hub->publish(new Update(self::getVoiceTopic($userId), $body, true));
        }
    }

    public static function createNotificationSubscriberToken(int $userId): array
    {
        $driver = self::getDriver();
        if (!$driver || Yii::$app->user->isGuest || $userId <= 0) {
            return [];
        }

        if ((int) Yii::$app->user->id !== $userId) {
            return [];
        }

        $topic = self::getNotificationTopic($userId);
        $token = [
            'mercure' => [
                'subscribe' => [$topic],
                'publish' => [],
            ],
            'exp' => time() + 60 * 60 * 6,
        ];

        return [
            'available' => true,
            'hubUrl' => $driver->hubUrl ?: Url::to('/.well-known/mercure', true),
            'topic' => $topic,
            'jwt' => JWT::encode($token, $driver->jwtKeySubscriber, 'HS256'),
        ];
    }

    public static function createVoiceSubscriberToken(int $userId): array
    {
        $driver = self::getDriver();
        if (!$driver || Yii::$app->user->isGuest || $userId <= 0) {
            return [];
        }

        if ((int) Yii::$app->user->id !== $userId) {
            return [];
        }

        $topic = self::getVoiceTopic($userId);
        $token = [
            'mercure' => [
                'subscribe' => [$topic],
                'publish' => [],
            ],
            'exp' => time() + 60 * 60 * 6,
        ];

        return [
            'available' => true,
            'hubUrl' => $driver->hubUrl ?: Url::to('/.well-known/mercure', true),
            'topic' => $topic,
            'jwt' => JWT::encode($token, $driver->jwtKeySubscriber, 'HS256'),
        ];
    }

    public static function createSubscriberToken(int $conversationId): array
    {
        $config = self::createSubscriberTokenForConversations([$conversationId]);
        if (empty($config)) {
            return [];
        }

        return array_merge($config, [
            'topic' => $config['topics'][0] ?? self::getTopic($conversationId),
        ]);
    }

    public static function createSubscriberTokenForConversations(array $conversationIds): array
    {
        $driver = self::getDriver();
        if (!$driver || Yii::$app->user->isGuest || empty($conversationIds)) {
            return [];
        }

        $topics = array_map(static fn(int $id) => self::getTopic($id), array_map('intval', $conversationIds));
        $token = [
            'mercure' => [
                'subscribe' => $topics,
                'publish' => [],
            ],
            'exp' => time() + 60 * 60 * 6,
        ];

        return [
            'hubUrl' => $driver->hubUrl ?: Url::to('/.well-known/mercure', true),
            'topics' => $topics,
            'jwt' => JWT::encode($token, $driver->jwtKeySubscriber, 'HS256'),
        ];
    }

    protected static function getDriver(): ?MercurePushDriver
    {
        if (!Yii::$app->has('live')) {
            return null;
        }

        $driver = Yii::$app->live->driver ?? null;

        return $driver instanceof MercurePushDriver ? $driver : null;
    }

    protected static function createPublisherHub(MercurePushDriver $driver): Hub
    {
        $jwFactory = new LcobucciFactory($driver->jwtKeyPublisher);
        $provider = new FactoryTokenProvider($jwFactory, publish: ['*']);
        $client = $driver->verifySsl
            ? null
            : new CurlHttpClient([
                'verify_peer' => false,
                'verify_host' => false,
            ]);

        $hubUrl = $driver->hubUrl ?: Url::to('/.well-known/mercure', true);

        return new Hub($hubUrl, $provider, null, null, $client);
    }
}
