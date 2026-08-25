<?php

namespace humhub\modules\nexchat\controllers;

use humhub\components\Controller;
use humhub\modules\nexchat\components\BearerLogin;
use humhub\modules\space\models\Membership;
use humhub\modules\space\models\Space;
use Yii;
use yii\web\Response;

class SpacesController extends Controller
{
    private const SPACE_LIMIT = 50;

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
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        $spaces = [];
        foreach ($this->memberSpaces() as $space) {
            $spaces[] = $this->spacePayload($space);
        }

        return ['spaces' => $spaces];
    }

    public function actionDirectory()
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        $spaces = [];
        foreach ($this->visibleSpaces() as $space) {
            $spaces[] = $this->spacePayload($space);
        }

        return ['spaces' => $spaces];
    }

    public function actionView()
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        $space = $this->loadSpace((int) Yii::$app->request->get('id'));
        if (!($space instanceof Space)) {
            return $space;
        }

        if (!$this->canAccessSpace($space)) {
            return $this->fail(403, 'Você não tem acesso a este espaço.');
        }

        return array_merge($this->spacePayload($space), [
            'membership' => $this->membershipSettings($space),
        ]);
    }

    public function actionFollow()
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        $body = Yii::$app->request->getBodyParams();
        $space = $this->loadSpace((int) ($body['spaceId'] ?? 0));
        if (!($space instanceof Space)) {
            return $space;
        }

        if (!$this->canFollowSpace($space)) {
            return $this->fail(403, 'Este espaço é privado. Você precisa de um convite.');
        }

        $this->joinAndFollow($space);

        return array_merge($this->spacePayload($space), [
            'membership' => $this->membershipSettings($space),
        ]);
    }

    public function actionSaveMembership()
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        $body = Yii::$app->request->getBodyParams();
        $space = $this->loadSpace((int) ($body['spaceId'] ?? 0));
        if (!($space instanceof Space)) {
            return $space;
        }

        if (!$this->canAccessSpace($space)) {
            return $this->fail(403, 'Você não tem acesso a este espaço.');
        }

        $membership = $this->currentMembership($space);
        if (!$membership) {
            return $this->fail(403, 'Você não é membro deste espaço.');
        }

        if (array_key_exists('receivesNotifications', $body)
            && $membership->hasAttribute('send_notifications')
        ) {
            $membership->send_notifications = !empty($body['receivesNotifications']) ? 1 : 0;
        }

        if (array_key_exists('showsOnDashboard', $body)
            && $membership->hasAttribute('show_at_dashboard')
        ) {
            $membership->show_at_dashboard = !empty($body['showsOnDashboard']) ? 1 : 0;
        }

        if (!$membership->save(false)) {
            return $this->fail(400, 'Não foi possível salvar as configurações do espaço.');
        }

        return ['membership' => $this->membershipSettings($space)];
    }

    public function actionLeave()
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        $body = Yii::$app->request->getBodyParams();
        $space = $this->loadSpace((int) ($body['spaceId'] ?? 0));
        if (!($space instanceof Space)) {
            return $space;
        }

        $membership = $this->currentMembership($space);
        if (!$membership) {
            return $this->fail(403, 'Você não é membro deste espaço.');
        }

        if (!$this->canLeaveSpace($space, $membership)) {
            return $this->fail(400, 'Você não pode deixar este espaço.');
        }

        if (method_exists($space, 'removeMember')) {
            $space->removeMember();
        } else {
            $membership->delete();
        }

        $this->unfollowSpace($space);

        return ['ok' => true];
    }

    /**
     * @return Space[]
     */
    private function memberSpaces(): array
    {
        $spaceIds = Membership::find()
            ->select('space_id')
            ->where([
                'user_id' => (int) Yii::$app->user->id,
                'status' => Membership::STATUS_MEMBER,
            ])
            ->column();

        if (!$spaceIds) {
            return [];
        }

        return Space::find()
            ->where(['id' => $spaceIds, 'status' => Space::STATUS_ENABLED])
            ->orderBy(['name' => SORT_ASC])
            ->limit(self::SPACE_LIMIT)
            ->all();
    }

    /**
     * @return Space[]
     */
    private function visibleSpaces(): array
    {
        $accessibleIds = array_values(array_unique(array_merge(
            $this->membershipSpaceIds(Membership::STATUS_MEMBER),
            $this->membershipSpaceIds(Membership::STATUS_INVITED),
        )));

        return Space::find()
            ->where(['status' => Space::STATUS_ENABLED])
            ->andWhere([
                'or',
                ['!=', 'visibility', Space::VISIBILITY_NONE],
                ['id' => $accessibleIds ?: [0]],
            ])
            ->orderBy(['name' => SORT_ASC])
            ->limit(self::SPACE_LIMIT)
            ->all();
    }

    /**
     * @return int[]
     */
    private function membershipSpaceIds(int $status): array
    {
        return array_map('intval', Membership::find()
            ->select('space_id')
            ->where([
                'user_id' => (int) Yii::$app->user->id,
                'status' => $status,
            ])
            ->column());
    }

    private function loadSpace(int $spaceId)
    {
        if ($spaceId <= 0) {
            return $this->fail(400, 'Espaço inválido.');
        }

        $space = Space::findOne(['id' => $spaceId]);
        if (!$space) {
            return $this->fail(404, 'Espaço não encontrado.');
        }

        return $space;
    }

    private function canAccessSpace(Space $space): bool
    {
        $identity = Yii::$app->user->identity;
        if ($identity && method_exists($identity, 'isSystemAdmin') && $identity->isSystemAdmin()) {
            return true;
        }

        if ($this->isPublicSpace($space)) {
            return true;
        }

        if ($space->isMember()) {
            return true;
        }

        return $this->isInvitedToSpace($space);
    }

    private function spacePayload(Space $space): array
    {
        return [
            'id' => (int) $space->id,
            'guid' => (string) $space->guid,
            'name' => (string) $space->name,
            'description' => $space->description !== null ? (string) $space->description : null,
            'contentcontainer_id' => $space->hasAttribute('contentcontainer_id')
                ? (int) $space->contentcontainer_id
                : 0,
            'visibility' => (int) $space->visibility,
            'status' => (int) $space->status,
            'postCount' => $this->postCount($space),
            'memberCount' => $this->memberCount($space),
            'followerCount' => $this->followerCount($space),
            'isMember' => $this->currentMembership($space) !== null,
            'isFollowing' => $this->isFollowingSpace($space),
            'isInvited' => $this->isInvitedToSpace($space),
        ];
    }

    private function memberCount(Space $space): int
    {
        return (int) Membership::find()
            ->where([
                'space_id' => $space->id,
                'status' => Membership::STATUS_MEMBER,
            ])
            ->count();
    }

    private function postCount(Space $space): int
    {
        $contentClass = 'humhub\\modules\\content\\models\\Content';
        $postClass = 'humhub\\modules\\post\\models\\Post';
        if (!class_exists($contentClass) || !class_exists($postClass)) {
            return 0;
        }

        $containerId = $space->hasAttribute('contentcontainer_id')
            ? (int) $space->contentcontainer_id
            : 0;
        if ($containerId <= 0) {
            return 0;
        }

        $query = $contentClass::find()->where([
            'contentcontainer_id' => $containerId,
            'object_model' => $postClass,
        ]);

        if (defined($contentClass . '::STATE_PUBLISHED')) {
            $query->andWhere(['state' => $contentClass::STATE_PUBLISHED]);
        }

        return (int) $query->count();
    }

    private function membershipSettings(Space $space): ?array
    {
        $membership = $this->currentMembership($space);
        if (!$membership) {
            return null;
        }

        return [
            'receivesNotifications' => $this->boolAttribute($membership, 'send_notifications', true),
            'showsOnDashboard' => $this->boolAttribute($membership, 'show_at_dashboard', true),
            'canLeave' => $this->canLeaveSpace($space, $membership),
        ];
    }

    private function currentMembership(Space $space): ?Membership
    {
        if (method_exists($space, 'getMembership')) {
            $membership = $space->getMembership();
            if ($membership instanceof Membership
                && (int) $membership->status === Membership::STATUS_MEMBER
            ) {
                return $membership;
            }
        }

        return Membership::findOne([
            'space_id' => $space->id,
            'user_id' => (int) Yii::$app->user->id,
            'status' => Membership::STATUS_MEMBER,
        ]);
    }

    private function canLeaveSpace(Space $space, Membership $membership): bool
    {
        if (method_exists($membership, 'canCancelMembership')) {
            return (bool) $membership->canCancelMembership();
        }

        if (method_exists($space, 'canLeave')) {
            return (bool) $space->canLeave();
        }

        return (string) ($membership->role ?? '') !== 'owner';
    }

    private function boolAttribute(Membership $membership, string $name, bool $default): bool
    {
        if (!$membership->hasAttribute($name)) {
            return $default;
        }

        return (bool) $membership->$name;
    }

    private function followerCount(Space $space): int
    {
        if (method_exists($space, 'getFollowerCount')) {
            return (int) $space->getFollowerCount();
        }

        $followClass = 'humhub\\modules\\user\\models\\Follow';
        if (!class_exists($followClass)) {
            return 0;
        }

        return (int) $followClass::find()
            ->where([
                'object_model' => Space::class,
                'object_id' => $space->id,
            ])
            ->count();
    }

    private function canFollowSpace(Space $space): bool
    {
        if ($this->isPublicSpace($space)) {
            return true;
        }

        if (method_exists($space, 'isAdmin') && $space->isAdmin()) {
            return true;
        }

        return $this->currentMembership($space) !== null
            || $this->isInvitedToSpace($space);
    }

    private function joinAndFollow(Space $space): void
    {
        $userId = (int) Yii::$app->user->id;
        if (method_exists($space, 'addMember')) {
            $space->addMember($userId);
        }

        $this->followSpace($space);
    }

    private function followSpace(Space $space): void
    {
        if (method_exists($space, 'follow')) {
            $space->follow();
        }
    }

    private function unfollowSpace(Space $space): void
    {
        if (method_exists($space, 'unfollow')) {
            $space->unfollow();
        }
    }

    private function isPublicSpace(Space $space): bool
    {
        return (int) $space->visibility !== Space::VISIBILITY_NONE;
    }

    private function isInvitedToSpace(Space $space): bool
    {
        return Membership::find()
            ->where([
                'space_id' => $space->id,
                'user_id' => (int) Yii::$app->user->id,
                'status' => Membership::STATUS_INVITED,
            ])
            ->exists();
    }

    private function isFollowingSpace(Space $space): bool
    {
        if (method_exists($space, 'isFollowedByUser')) {
            return (bool) $space->isFollowedByUser();
        }

        $followClass = 'humhub\\modules\\user\\models\\Follow';
        if (!class_exists($followClass)) {
            return false;
        }

        return $followClass::find()
            ->where([
                'object_model' => Space::class,
                'object_id' => $space->id,
                'user_id' => (int) Yii::$app->user->id,
            ])
            ->exists();
    }

    private function fail(int $status, string $message): array
    {
        Yii::$app->response->statusCode = $status;

        return ['message' => $message];
    }
}
