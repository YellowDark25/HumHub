<?php

namespace humhub\modules\nexchat\controllers;

use humhub\components\Controller;
use humhub\modules\nexchat\components\BearerLogin;
use humhub\modules\nexchat\components\NexchatFriendship;
use humhub\modules\nexchat\notifications\FriendshipAcceptedNotification;
use humhub\modules\nexchat\notifications\FriendshipRequestNotification;
use humhub\modules\notification\components\BaseNotification;
use humhub\modules\user\models\User;
use Yii;
use yii\web\Response;

class PeopleController extends Controller
{
    private const USER_LIMIT = 200;
    private const ONLINE_WINDOW_SECONDS = 300;

    public $enableCsrfValidation = false;

    public $layout = false;

    public function beforeAction($action)
    {
        BearerLogin::authenticate();
        if (BearerLogin::hasBearer()) {
            $this->enableCsrfValidation = false;
        }

        Yii::$app->response->format = Response::FORMAT_JSON;

        return parent::beforeAction($action);
    }

    public function actionIndex()
    {
        $viewer = $this->currentUser();
        if (!($viewer instanceof User)) {
            return $this->fail(401, 'Não autenticado.');
        }

        $states = NexchatFriendship::statesFor($viewer);
        $users = [];
        foreach ($this->visibleUsers() as $user) {
            $users[] = $this->toPerson($viewer, $user, $states);
        }

        return ['users' => $users];
    }

    public function actionView()
    {
        $viewer = $this->currentUser();
        if (!($viewer instanceof User)) {
            return $this->fail(401, 'Não autenticado.');
        }

        $user = $this->loadUser((int) Yii::$app->request->get('id', 0));
        if (!($user instanceof User)) {
            return $user;
        }

        return ['user' => $this->toPerson($viewer, $user)];
    }

    public function actionFollow()
    {
        return $this->changeFriendship(true);
    }

    public function actionUnfollow()
    {
        return $this->changeFriendship(false);
    }

    private function changeFriendship(bool $follow)
    {
        $viewer = $this->currentUser();
        if (!($viewer instanceof User)) {
            return $this->fail(401, 'Não autenticado.');
        }

        $body = Yii::$app->request->getBodyParams();
        $user = $this->loadUser((int) ($body['userId'] ?? 0));
        if (!($user instanceof User)) {
            return $user;
        }

        if ((int) $user->id === (int) $viewer->id) {
            return $this->fail(400, 'Não é possível seguir a própria conta.');
        }

        if (!NexchatFriendship::isAvailable()) {
            return $this->fail(400, 'O processo de amizade não está disponível.');
        }

        $previous = NexchatFriendship::state($viewer, $user);

        if ($follow && !NexchatFriendship::add($viewer, $user)) {
            return $this->fail(400, 'Não foi possível enviar o pedido de amizade.');
        }

        if (!$follow) {
            NexchatFriendship::cancel($viewer, $user);
        }

        $this->notifyFriendshipChange($viewer, $user, $previous, $follow);
        $user->refresh();

        return ['user' => $this->toPerson($viewer, $user)];
    }

    private function notifyFriendshipChange(User $viewer, User $target, string $previous, bool $follow): void
    {
        $next = NexchatFriendship::state($viewer, $target);

        if ($follow && $previous === NexchatFriendship::NONE && $next === NexchatFriendship::OUTGOING) {
            $this->sendFriendshipNotice(FriendshipRequestNotification::class, $viewer, $target);
            return;
        }

        if ($follow && $previous === NexchatFriendship::INCOMING && $next === NexchatFriendship::FRIENDS) {
            $this->deleteFriendshipNotice(FriendshipRequestNotification::class, $target, $viewer);
            $this->sendFriendshipNotice(FriendshipAcceptedNotification::class, $viewer, $target);
            return;
        }

        if ($follow) {
            return;
        }

        $this->deleteFriendshipNotice(FriendshipRequestNotification::class, $viewer, $target);
        $this->deleteFriendshipNotice(FriendshipRequestNotification::class, $target, $viewer);
    }

    /**
     * @param class-string<BaseNotification> $notificationClass
     */
    private function sendFriendshipNotice(string $notificationClass, User $from, User $to): void
    {
        try {
            $notificationClass::instance()
                ->from($from)
                ->about($from)
                ->send($to);
        } catch (\Throwable $error) {
            Yii::error($error, 'nexchat');
        }
    }

    /**
     * @param class-string<BaseNotification> $notificationClass
     */
    private function deleteFriendshipNotice(string $notificationClass, User $from, User $to): void
    {
        try {
            $notificationClass::instance()->from($from)->delete($to);
        } catch (\Throwable $error) {
            Yii::error($error, 'nexchat');
        }
    }

    /**
     * @return User[]
     */
    private function visibleUsers(): array
    {
        return User::find()
            ->active()
            ->with(['profile', 'groups'])
            ->orderBy(['user.username' => SORT_ASC])
            ->limit(self::USER_LIMIT)
            ->all();
    }

    /**
     * @param array<int, string>|null $states
     * @return array{id: int, name: string, username: string, title: string, about: string, tags: string[], groups: array<int, array{id: int, name: string}>, imageUrl: string, isOnline: bool, lastSeenAt: string|null, isSelf: bool, friendship: string}
     */
    private function toPerson(User $viewer, User $user, ?array $states = null): array
    {
        $isSelf = (int) $user->id === (int) $viewer->id;
        $friendship = $isSelf
            ? NexchatFriendship::NONE
            : ($states === null
                ? NexchatFriendship::state($viewer, $user)
                : ($states[(int) $user->id] ?? NexchatFriendship::NONE));

        return [
            'id' => (int) $user->id,
            'name' => (string) ($user->displayName ?? $user->username ?? 'Usuário'),
            'username' => (string) ($user->username ?? ''),
            'title' => trim((string) ($user->profile?->title ?? '')),
            'about' => trim((string) ($user->profile?->about ?? '')),
            'tags' => $this->userTags($user),
            'groups' => $this->userGroups($user),
            'imageUrl' => $this->userImageUrl($user),
            'isOnline' => $this->isUserOnline($user),
            'lastSeenAt' => $this->lastSeenAt($user),
            'isSelf' => $isSelf,
            'friendship' => $friendship,
        ];
    }

    /**
     * @return string[]
     */
    private function userTags(User $user): array
    {
        if (method_exists($user, 'getTags')) {
            return array_values(array_filter(array_map(
                static fn($tag) => trim((string) $tag),
                $user->getTags(),
            )));
        }

        return array_values(array_filter(array_map(
            'trim',
            explode(',', (string) ($user->tags ?? '')),
        )));
    }

    /**
     * @return array<int, array{id: int, name: string}>
     */
    private function userGroups(User $user): array
    {
        $groups = [];
        foreach ($user->groups as $group) {
            $groups[] = [
                'id' => (int) $group->id,
                'name' => (string) ($group->name ?? ''),
            ];
        }

        return $groups;
    }

    private function lastSeenAt(User $user): ?string
    {
        $lastLogin = $user->hasAttribute('last_login')
            ? $user->getAttribute('last_login')
            : null;
        if (!$lastLogin) {
            return null;
        }

        $timestamp = strtotime((string) $lastLogin);

        return $timestamp ? gmdate('c', $timestamp) : null;
    }

    /**
     * @return User|array
     */
    private function loadUser(int $userId)
    {
        if ($userId <= 0) {
            return $this->fail(400, 'Pessoa inválida.');
        }

        $user = User::find()->active()->with('profile')->andWhere(['user.id' => $userId])->one();
        if (!($user instanceof User)) {
            return $this->fail(404, 'Pessoa não encontrada.');
        }

        return $user;
    }

    private function currentUser(): ?User
    {
        if (Yii::$app->user->isGuest) {
            return null;
        }

        $identity = Yii::$app->user->getIdentity();

        return $identity instanceof User ? $identity : null;
    }

    private function isUserOnline(User $user): bool
    {
        $lastLogin = $user->hasAttribute('last_login')
            ? $user->getAttribute('last_login')
            : null;
        if (!$lastLogin) {
            return false;
        }

        return strtotime((string) $lastLogin) >= time() - self::ONLINE_WINDOW_SECONDS;
    }

    private function userImageUrl(User $user): string
    {
        try {
            return (string) $user->getProfileImage()->getUrl('', true);
        } catch (\Throwable $error) {
            Yii::warning($error->getMessage(), 'nexchat');

            return '';
        }
    }

    private function fail(int $status, string $message): array
    {
        Yii::$app->response->statusCode = $status;

        return ['message' => $message];
    }
}
