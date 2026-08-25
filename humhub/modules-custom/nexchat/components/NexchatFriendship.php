<?php

namespace humhub\modules\nexchat\components;

use humhub\modules\friendship\models\Friendship;
use humhub\modules\user\models\User;

class NexchatFriendship
{
    public const NONE = 'none';
    public const OUTGOING = 'outgoing';
    public const INCOMING = 'incoming';
    public const FRIENDS = 'friends';

    public static function isAvailable(): bool
    {
        return class_exists(Friendship::class);
    }

    public static function state(User $user, User $friend): string
    {
        if (!self::isAvailable() || (int) $user->id === (int) $friend->id) {
            return self::NONE;
        }

        return self::nameOf(Friendship::getStateForUser($user, $friend));
    }

    public static function areFriends(User $user, User $friend): bool
    {
        return self::state($user, $friend) === self::FRIENDS;
    }

    public static function canDirectMessage(User $user, User $friend): bool
    {
        return !self::isAvailable() || self::areFriends($user, $friend);
    }

    /**
     * @return array<int, string>
     */
    public static function statesFor(User $user): array
    {
        if (!self::isAvailable()) {
            return [];
        }

        $states = [];
        foreach (self::idSet(Friendship::getFriendsQuery($user)) as $id) {
            $states[$id] = self::FRIENDS;
        }
        foreach (self::idSet(Friendship::getSentRequestsQuery($user)) as $id) {
            $states[$id] = self::OUTGOING;
        }
        foreach (self::idSet(Friendship::getReceivedRequestsQuery($user)) as $id) {
            $states[$id] = self::INCOMING;
        }

        return $states;
    }

    /**
     * @return array<int, true>
     */
    public static function friendIdSet(User $user): array
    {
        $ids = [];
        foreach (self::statesFor($user) as $id => $state) {
            if ($state === self::FRIENDS) {
                $ids[$id] = true;
            }
        }

        return $ids;
    }

    public static function add(User $user, User $friend): bool
    {
        if (!self::isAvailable()) {
            return false;
        }

        $state = self::state($user, $friend);
        if ($state === self::FRIENDS || $state === self::OUTGOING) {
            return true;
        }

        return Friendship::add($user, $friend);
    }

    public static function cancel(User $user, User $friend): void
    {
        if (!self::isAvailable()) {
            return;
        }

        Friendship::cancel($user, $friend);
    }

    /**
     * @return int[]
     */
    private static function idSet($query): array
    {
        $ids = [];
        foreach ($query->select('user.id')->column() as $id) {
            $ids[] = (int) $id;
        }

        return $ids;
    }

    private static function nameOf(int $state): string
    {
        if ($state === self::constant('STATE_FRIENDS', 'FRIENDSHIP_FRIENDS', 1)) {
            return self::FRIENDS;
        }
        if ($state === self::constant('STATE_REQUEST_SENT', 'FRIENDSHIP_REQUEST_SENT', 3)) {
            return self::OUTGOING;
        }
        if ($state === self::constant('STATE_REQUEST_RECEIVED', 'FRIENDSHIP_REQUEST_RECEIVED', 2)) {
            return self::INCOMING;
        }

        return self::NONE;
    }

    private static function constant(string $current, string $legacy, int $fallback): int
    {
        if (defined(Friendship::class . '::' . $current)) {
            return constant(Friendship::class . '::' . $current);
        }
        if (defined(Friendship::class . '::' . $legacy)) {
            return constant(Friendship::class . '::' . $legacy);
        }

        return $fallback;
    }
}
