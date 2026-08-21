<?php

namespace humhub\modules\nexchat\controllers;

use humhub\components\Controller;
use humhub\libs\BasePermission;
use humhub\modules\nexchat\components\BearerLogin;
use humhub\modules\user\models\Group;
use humhub\modules\user\models\GroupUser;
use humhub\modules\user\models\User;
use Yii;
use yii\web\Response;

class GroupController extends Controller
{
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
        $denied = $this->requireAdmin();
        if ($denied !== null) {
            return $denied;
        }

        $groups = [];
        foreach (Group::find()->orderBy(['sort_order' => SORT_ASC, 'name' => SORT_ASC])->all() as $group) {
            $groups[] = $this->toGroup($group);
        }

        return ['groups' => $groups];
    }

    public function actionView()
    {
        $group = $this->loadGroup();
        if (!($group instanceof Group)) {
            return $group;
        }

        return $this->toGroup($group);
    }

    public function actionSave()
    {
        $denied = $this->requireAdmin();
        if ($denied !== null) {
            return $denied;
        }

        $body = Yii::$app->request->getBodyParams();
        $id = (int) ($body['id'] ?? 0);
        $group = $id > 0 ? Group::findOne(['id' => $id]) : new Group();
        if ($id > 0 && !$group) {
            return $this->fail(404, 'Grupo não encontrado.');
        }

        $group->name = trim((string) ($body['name'] ?? ''));
        $group->description = trim((string) ($body['description'] ?? ''));
        $group->show_at_directory = !empty($body['showAtDirectory']) ? 1 : 0;
        $group->notify_users = !empty($body['notifyUsers']) ? 1 : 0;
        $group->sort_order = (int) ($body['sortOrder'] ?? 100);

        if (!$group->is_admin_group) {
            $group->show_at_registration = !empty($body['showAtRegistration']) ? 1 : 0;
            $group->is_default_group = !empty($body['isDefault']) ? 1 : 0;
        }

        if ($group->name === '') {
            return $this->fail(400, 'Informe o nome do grupo.');
        }

        if (!$group->save()) {
            return $this->fail(400, $this->firstError($group));
        }

        return $this->toGroup(Group::findOne(['id' => $group->id]));
    }

    public function actionDelete()
    {
        $group = $this->loadGroup();
        if (!($group instanceof Group)) {
            return $group;
        }

        $restriction = $this->deleteRestriction($group);
        if ($restriction !== null) {
            return $this->fail(400, $restriction);
        }

        $group->delete();

        return ['ok' => true];
    }

    public function actionMembers()
    {
        $group = $this->loadGroup();
        if (!($group instanceof Group)) {
            return $group;
        }

        return ['members' => $this->membersOf($group)];
    }

    public function actionAddMember()
    {
        $group = $this->loadGroup();
        if (!($group instanceof Group)) {
            return $group;
        }

        $body = Yii::$app->request->getBodyParams();
        $user = User::findOne(['id' => (int) ($body['userId'] ?? 0)]);
        if (!$user) {
            return $this->fail(404, 'Usuário não encontrado.');
        }

        $group->addUser($user, !empty($body['isManager']));

        return ['members' => $this->membersOf($group)];
    }

    public function actionRemoveMember()
    {
        $group = $this->loadGroup();
        if (!($group instanceof Group)) {
            return $group;
        }

        $userId = (int) (Yii::$app->request->getBodyParams()['userId'] ?? 0);
        if ($userId <= 0) {
            return $this->fail(400, 'Usuário inválido.');
        }

        $groupsCount = GroupUser::find()->where(['user_id' => $userId])->count();
        if ($groupsCount <= 1) {
            return $this->fail(400, 'O usuário precisa pertencer a pelo menos um grupo.');
        }

        if (!$group->removeUser($userId)) {
            return $this->fail(400, 'Não foi possível remover o usuário deste grupo.');
        }

        return ['members' => $this->membersOf($group)];
    }

    public function actionSetManager()
    {
        $group = $this->loadGroup();
        if (!($group instanceof Group)) {
            return $group;
        }

        if ($group->is_admin_group) {
            return $this->fail(400, 'Não é possível alterar o gerente do grupo de administradores.');
        }

        $body = Yii::$app->request->getBodyParams();
        $user = User::findOne(['id' => (int) ($body['userId'] ?? 0)]);
        if (!$user) {
            return $this->fail(404, 'Usuário não encontrado.');
        }

        $groupUser = $group->getGroupUser($user);
        if ($groupUser === null) {
            return $this->fail(404, 'Este usuário não é membro do grupo.');
        }

        $groupUser->is_group_manager = !empty($body['isManager']) ? 1 : 0;
        if (!$groupUser->save()) {
            return $this->fail(400, 'Não foi possível atualizar o gerente do grupo.');
        }

        return ['members' => $this->membersOf($group)];
    }

    public function actionPermissions()
    {
        $group = $this->loadGroup();
        if (!($group instanceof Group)) {
            return $group;
        }

        return ['permissions' => $this->permissionsOf($group)];
    }

    public function actionSetPermission()
    {
        $group = $this->loadGroup();
        if (!($group instanceof Group)) {
            return $group;
        }

        $body = Yii::$app->request->getBodyParams();
        $permissionId = trim((string) ($body['permissionId'] ?? ''));
        $moduleId = trim((string) ($body['moduleId'] ?? ''));
        $state = trim((string) ($body['state'] ?? ''));
        if ($permissionId === '' || $moduleId === '') {
            return $this->fail(400, 'Informe a permissão.');
        }

        if (!in_array($state, ['default', 'allow', 'deny'], true)) {
            return $this->fail(400, 'Estado de permissão inválido.');
        }

        $manager = Yii::$app->user->permissionManager;
        $permission = $manager->getById($permissionId, $moduleId);
        if ($permission === null) {
            return $this->fail(404, 'Permissão não encontrada.');
        }

        if (!$permission->canChangeState($group->id)) {
            return $this->fail(400, 'Esta permissão não pode ser alterada neste grupo.');
        }

        $manager->setGroupState($group->id, $permission, $this->fromState($state));

        return ['permissions' => $this->permissionsOf($group)];
    }

    private function loadGroup()
    {
        $denied = $this->requireAdmin();
        if ($denied !== null) {
            return $denied;
        }

        $id = (int) Yii::$app->request->get('id', Yii::$app->request->getBodyParams()['id'] ?? 0);
        $group = Group::findOne(['id' => $id]);
        if (!$group) {
            return $this->fail(404, 'Grupo não encontrado.');
        }

        return $group;
    }

    private function toGroup(Group $group): array
    {
        return [
            'id' => (int) $group->id,
            'name' => Yii::t('AdminModule.base', (string) $group->name),
            'description' => Yii::t('AdminModule.base', (string) $group->description),
            'type' => !empty($group->parent_group_id) ? 'subgroup' : 'normal',
            'memberCount' => (int) $group->getGroupUsers()->count(),
            'extraMemberCount' => method_exists($group, 'getSubGroupUsersCount')
                ? (int) $group->getSubGroupUsersCount()
                : 0,
            'isDefault' => (bool) $group->is_default_group,
            'isProtected' => (bool) $group->is_protected,
            'isAdminGroup' => (bool) $group->is_admin_group,
            'showAtDirectory' => (bool) $group->show_at_directory,
            'showAtRegistration' => (bool) $group->show_at_registration,
            'notifyUsers' => (bool) $group->notify_users,
            'sortOrder' => (int) $group->sort_order,
            'canDelete' => $this->deleteRestriction($group) === null,
        ];
    }

    private function membersOf(Group $group): array
    {
        $members = [];
        foreach ($group->getGroupUsers()->all() as $groupUser) {
            $user = $groupUser->user;
            if (!$user) {
                continue;
            }

            $members[] = [
                'id' => (int) $user->id,
                'name' => (string) $user->displayName,
                'email' => (string) $user->email,
                'imageUrl' => $this->imageUrl($user),
                'isManager' => (bool) $groupUser->is_group_manager,
            ];
        }

        return $members;
    }

    private function permissionsOf(Group $group): array
    {
        $manager = Yii::$app->user->permissionManager;
        $permissions = [];
        foreach ($manager->getPermissions() as $permission) {
            if (!$permission instanceof BasePermission) {
                continue;
            }

            $module = Yii::$app->getModule($permission->getModuleId());
            $defaultState = $permission->getDefaultState($group->id);
            $permissions[] = [
                'id' => (string) $permission->getId(),
                'moduleId' => (string) $permission->getModuleId(),
                'moduleName' => $module ? (string) $module->getName() : (string) $permission->getModuleId(),
                'title' => (string) $permission->getTitle(),
                'description' => (string) $permission->getDescription(),
                'state' => $this->toState($manager->getGroupState($group->id, $permission, false)),
                'defaultLabel' => 'Padrão — ' . $this->stateLabel($defaultState),
                'canChange' => $permission->canChangeState($group->id),
            ];
        }

        return $permissions;
    }

    private function toState($state): string
    {
        if ($state === BasePermission::STATE_ALLOW || $state === 1 || $state === '1') {
            return 'allow';
        }

        if ($state === BasePermission::STATE_DENY || $state === 0 || $state === '0') {
            return 'deny';
        }

        return 'default';
    }

    private function fromState(string $state)
    {
        return match ($state) {
            'allow' => BasePermission::STATE_ALLOW,
            'deny' => BasePermission::STATE_DENY,
            default => BasePermission::STATE_DEFAULT,
        };
    }

    private function stateLabel($state): string
    {
        return $this->toState($state) === 'allow' ? 'Permitir' : 'Negar';
    }

    private function imageUrl(User $user): string
    {
        try {
            return (string) $user->getProfileImage()->getUrl('', true);
        } catch (\Throwable $error) {
            Yii::warning($error->getMessage(), 'nexchat');

            return '';
        }
    }

    private function deleteRestriction(Group $group): ?string
    {
        if ($group->isNewRecord) {
            return 'Este grupo não pode ser excluído.';
        }

        if ($group->is_admin_group) {
            return 'O grupo de administradores não pode ser excluído.';
        }

        if ($group->is_default_group) {
            return 'O grupo padrão não pode ser excluído.';
        }

        if ($group->is_protected) {
            return 'O grupo protegido não pode ser excluído.';
        }

        return null;
    }

    private function firstError($model): string
    {
        $errors = $model->getFirstErrors();
        if (!$errors) {
            return 'Não foi possível salvar o grupo.';
        }

        return (string) reset($errors);
    }

    private function requireAdmin(): ?array
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        if (!Yii::$app->user->isAdmin()) {
            return $this->fail(403, 'Você não tem permissão para acessar esta área.');
        }

        return null;
    }

    private function fail(int $status, string $message): array
    {
        Yii::$app->response->statusCode = $status;

        return ['message' => $message];
    }
}
