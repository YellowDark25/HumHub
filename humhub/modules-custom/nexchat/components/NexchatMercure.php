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

    public static function getTopic(int $conversationId): string
    {
        return self::TOPIC_PREFIX . $conversationId;
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
