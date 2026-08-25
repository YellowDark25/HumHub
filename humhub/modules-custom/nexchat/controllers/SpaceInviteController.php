<?php

namespace humhub\modules\nexchat\controllers;

use humhub\components\Controller;
use humhub\modules\nexchat\components\BearerLogin;
use humhub\modules\nexchat\notifications\SpaceInviteNotification;
use humhub\modules\space\models\forms\InviteForm;
use humhub\modules\space\models\Membership;
use humhub\modules\space\models\Space;
use humhub\modules\user\models\User;
use Yii;
use yii\web\Response;

class SpaceInviteController extends Controller
{
    private const USER_LIMIT = 200;

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

    public function actionUsers()
    {
        $space = $this->loadSpace((int) Yii::$app->request->get('id'));
        if (!($space instanceof Space)) {
            return $space;
        }

        $denied = $this->requireInviteAccess($space);
        if ($denied !== null) {
            return $denied;
        }

        $users = [];
        foreach ($this->invitableUsers($space) as $user) {
            $users[] = [
                'id' => (int) $user->id,
                'name' => (string) ($user->displayName ?? $user->username ?? 'Usuário'),
                'username' => (string) ($user->username ?? ''),
                'imageUrl' => $this->userImageUrl($user),
            ];
        }

        return ['users' => $users];
    }

    public function actionSend()
    {
        $body = Yii::$app->request->getBodyParams();
        $space = $this->loadSpace((int) ($body['spaceId'] ?? 0));
        if (!($space instanceof Space)) {
            return $space;
        }

        $denied = $this->requireInviteAccess($space);
        if ($denied !== null) {
            return $denied;
        }

        $invitees = $this->selectedInvitees($space, $body);
        $form = $this->buildInviteForm($space, $invitees, $body);
        if (!$form->save()) {
            return $this->fail(400, $this->firstError($form));
        }

        if (!$form->withoutInvite) {
            $this->notifyInvitees($space, $invitees);
        }

        return ['ok' => true];
    }

    public function actionReceived()
    {
        $denied = $this->requireLogin();
        if ($denied !== null) {
            return $denied;
        }

        $invites = [];
        foreach ($this->pendingMemberships() as $membership) {
            $item = $this->toReceivedInvite($membership);
            if ($item !== null) {
                $invites[] = $item;
            }
        }

        return ['invites' => $invites];
    }

    public function actionAccept()
    {
        return $this->resolvePendingInvite(true);
    }

    public function actionDecline()
    {
        return $this->resolvePendingInvite(false);
    }

    /**
     * @return User[]
     */
    private function selectedInvitees(Space $space, array $body): array
    {
        if (!empty($body['selectAllRegistered'])) {
            return $this->invitableUsers($space);
        }

        return $this->usersByIds($body['userIds'] ?? []);
    }

    /**
     * @param User[] $invitees
     */
    private function buildInviteForm(Space $space, array $invitees, array $body): InviteForm
    {
        $form = new InviteForm();
        $form->space = $space;
        $form->invite = array_map(static fn (User $user) => (string) $user->guid, $invitees);
        $form->allRegisteredUsers = !empty($body['selectAllRegistered']);
        $form->withoutInvite = !empty($body['addWithoutInvite']);
        $form->addDefaultSpace = !empty($body['addAsDefaultSpace']);

        return $form;
    }

    /**
     * @param User[] $invitees
     */
    private function notifyInvitees(Space $space, array $invitees): void
    {
        $originator = Yii::$app->user->identity;
        if (!$originator) {
            return;
        }

        foreach ($invitees as $user) {
            if ((int) $user->id === (int) $originator->id) {
                continue;
            }

            try {
                SpaceInviteNotification::instance()
                    ->from($originator)
                    ->about($space)
                    ->send($user);
            } catch (\Throwable $error) {
                Yii::error($error, 'nexchat');
            }
        }
    }

    /**
     * @return Membership[]
     */
    private function pendingMemberships(): array
    {
        return Membership::find()
            ->where([
                'user_id' => (int) Yii::$app->user->id,
                'status' => Membership::STATUS_INVITED,
            ])
            ->all();
    }

    private function toReceivedInvite(Membership $membership): ?array
    {
        $space = $membership->space ?? Space::findOne(['id' => $membership->space_id]);
        if (!$space) {
            return null;
        }

        $originator = $this->inviteOriginator($membership);

        return [
            'spaceId' => (int) $space->id,
            'spaceName' => (string) $space->name,
            'spaceImageUrl' => $this->spaceImageUrl($space),
            'invitedByName' => $originator
                ? (string) ($originator->displayName ?? $originator->username ?? '')
                : '',
        ];
    }

    private function inviteOriginator(Membership $membership): ?User
    {
        foreach (['originator_user_id', 'created_by'] as $field) {
            if (!$membership->hasAttribute($field)) {
                continue;
            }

            $userId = (int) $membership->$field;
            if ($userId <= 0) {
                continue;
            }

            return User::findOne(['id' => $userId]);
        }

        return null;
    }

    private function resolvePendingInvite(bool $accept)
    {
        $denied = $this->requireLogin();
        if ($denied !== null) {
            return $denied;
        }

        $body = Yii::$app->request->getBodyParams();
        $space = $this->loadSpace((int) ($body['spaceId'] ?? 0));
        if (!($space instanceof Space)) {
            return $space;
        }

        $membership = Membership::findOne([
            'space_id' => $space->id,
            'user_id' => (int) Yii::$app->user->id,
            'status' => Membership::STATUS_INVITED,
        ]);
        if (!$membership) {
            return $this->fail(404, 'Convite não encontrado.');
        }

        if ($accept) {
            $this->acceptMembership($space, $membership);
        } else {
            $membership->delete();
        }

        return ['ok' => true];
    }

    private function acceptMembership(Space $space, Membership $membership): void
    {
        if (method_exists($space, 'addMember')) {
            $space->addMember((int) Yii::$app->user->id);
        } else {
            $membership->status = Membership::STATUS_MEMBER;
            $membership->save(false);
        }

        if (method_exists($space, 'follow')) {
            $space->follow();
        }
    }

    /**
     * @return User[]
     */
    private function invitableUsers(Space $space): array
    {
        $memberIds = Membership::find()
            ->select('user_id')
            ->where(['space_id' => $space->id, 'status' => Membership::STATUS_MEMBER])
            ->column();

        $query = User::find()->active()->orderBy(['user.username' => SORT_ASC]);
        if ($memberIds) {
            $query->andWhere(['not in', 'user.id', $memberIds]);
        }

        return $query->limit(self::USER_LIMIT)->all();
    }

    /**
     * @param mixed $userIds
     * @return User[]
     */
    private function usersByIds($userIds): array
    {
        if (!is_array($userIds)) {
            return [];
        }

        $ids = array_values(array_unique(array_filter(array_map('intval', $userIds))));
        if (!$ids) {
            return [];
        }

        return User::find()->active()->andWhere(['user.id' => $ids])->all();
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

    private function requireLogin(): ?array
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        return null;
    }

    private function requireInviteAccess(Space $space): ?array
    {
        $denied = $this->requireLogin();
        if ($denied !== null) {
            return $denied;
        }

        if ($this->canInvite($space)) {
            return null;
        }

        return $this->fail(403, 'Você não tem permissão para convidar membros neste espaço.');
    }

    private function canInvite(Space $space): bool
    {
        $identity = Yii::$app->user->identity;
        if ($identity && method_exists($identity, 'isSystemAdmin') && $identity->isSystemAdmin()) {
            return true;
        }

        if (method_exists($space, 'isAdmin') && $space->isAdmin()) {
            return true;
        }

        return method_exists($space, 'canInvite') && $space->canInvite();
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

    private function spaceImageUrl(Space $space): string
    {
        try {
            return (string) $space->getProfileImage()->getUrl('', true);
        } catch (\Throwable $error) {
            Yii::warning($error->getMessage(), 'nexchat');

            return '';
        }
    }

    private function firstError(InviteForm $form): string
    {
        $errors = $form->getFirstErrors();
        if (!$errors) {
            return 'Não foi possível enviar os convites.';
        }

        return (string) reset($errors);
    }

    private function fail(int $status, string $message): array
    {
        Yii::$app->response->statusCode = $status;

        return ['message' => $message];
    }
}
