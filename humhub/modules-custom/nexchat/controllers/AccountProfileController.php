<?php

namespace humhub\modules\nexchat\controllers;

use humhub\components\Controller;
use humhub\modules\nexchat\components\BearerLogin;
use humhub\modules\nexchat\components\CurrentPassword;
use humhub\modules\nexchat\permissions\EditOtherUsers;
use humhub\modules\user\models\Password;
use humhub\modules\user\models\Profile;
use humhub\modules\user\models\User;
use Yii;
use yii\web\Response;

class AccountProfileController extends Controller
{
    public $enableCsrfValidation = true;

    public $layout = false;

    private const PROFILE_FIELDS = [
        'firstname',
        'lastname',
        'title',
        'gender',
        'street',
        'zip',
        'city',
        'country',
        'state',
        'birthday',
        'about',
        'phone_private',
        'phone_work',
        'mobile',
        'fax',
        'im_skype',
        'im_xmpp',
        'url',
        'url_facebook',
        'url_linkedin',
        'url_xing',
        'url_youtube',
        'url_vimeo',
        'url_flickr',
        'url_myspace',
        'url_twitter',
    ];

    public function beforeAction($action)
    {
        BearerLogin::authenticate();
        if (BearerLogin::hasBearer()) {
            $this->enableCsrfValidation = false;
        }

        Yii::$app->response->format = Response::FORMAT_JSON;

        return parent::beforeAction($action);
    }

    public function actionSave()
    {
        $target = $this->loadTarget();
        if (!($target instanceof User)) {
            return $target;
        }

        $body = Yii::$app->request->getBodyParams();
        $isSelf = $this->isSelf($target);

        if (isset($body['profile']) && is_array($body['profile'])) {
            $denied = $this->saveProfile($target, $body['profile'], $isSelf);
            if ($denied !== null) {
                return $denied;
            }
        }

        if (isset($body['account']) && is_array($body['account'])) {
            $denied = $this->saveAccount($target, $body['account']);
            if ($denied !== null) {
                return $denied;
            }
        }

        $password = $this->readPassword($body);
        if ($password !== '') {
            $denied = $this->savePassword(
                $target,
                $password,
                $this->readCurrentPassword($body),
                $isSelf,
            );
            if ($denied !== null) {
                return $denied;
            }
        }

        $target->refresh();

        return $this->toUser($target);
    }

    public function actionImage()
    {
        $target = $this->loadTarget();
        if (!($target instanceof User)) {
            return $target;
        }

        $imageDataUrl = trim((string) (Yii::$app->request->getBodyParams()['image'] ?? ''));
        if (!preg_match('/^data:image\/(jpeg|jpg|png|gif|webp);base64,/i', $imageDataUrl)) {
            return $this->fail(400, 'Envie uma imagem JPG, PNG, GIF ou WebP.');
        }

        $payload = explode(',', $imageDataUrl, 2)[1] ?? '';
        $binary = base64_decode($payload, true);
        if ($binary === false || $binary === '') {
            return $this->fail(400, 'Envie uma imagem JPG, PNG, GIF ou WebP.');
        }

        $tempFile = tempnam(sys_get_temp_dir(), 'usrimg');
        if ($tempFile === false || file_put_contents($tempFile, $binary) === false) {
            return $this->fail(500, 'Não foi possível processar a imagem.');
        }

        try {
            $target->getProfileImage()->setNew($tempFile);
        } catch (\Throwable $error) {
            Yii::error($error->getMessage(), 'nexchat');

            return $this->fail(400, 'Não foi possível atualizar a foto de perfil.');
        } finally {
            if (is_file($tempFile)) {
                @unlink($tempFile);
            }
        }

        $target->refresh();

        return $this->toUser($target);
    }

    private function loadTarget()
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        /** @var User $actor */
        $actor = Yii::$app->user->identity;
        $requestedId = (int) (Yii::$app->request->getBodyParams()['userId'] ?? $actor->id);
        $target = $requestedId === (int) $actor->id
            ? $actor
            : User::findOne(['id' => $requestedId]);

        if (!$target) {
            return $this->fail(404, 'Usuário não encontrado.');
        }

        if (!$this->canEdit($target)) {
            return $this->fail(403, 'Você não tem permissão para editar outros usuários.');
        }

        return $target;
    }

    private function canEdit(User $target): bool
    {
        if ($this->isSelf($target)) {
            return true;
        }

        return Yii::$app->user->can(new EditOtherUsers());
    }

    private function isSelf(User $target): bool
    {
        $actor = Yii::$app->user->identity;

        return $actor && (int) $actor->id === (int) $target->id;
    }

    private function saveProfile(User $user, array $data, bool $isSelf)
    {
        $profile = $user->profile;
        $profile->scenario = $isSelf
            ? Profile::SCENARIO_EDIT_PROFILE
            : Profile::SCENARIO_EDIT_ADMIN;

        foreach (self::PROFILE_FIELDS as $field) {
            if (!array_key_exists($field, $data) || !$profile->hasAttribute($field)) {
                continue;
            }

            $profile->$field = $data[$field];
        }

        if (!$profile->save()) {
            return $this->fail(400, $this->firstError($profile, 'Não foi possível salvar o perfil.'));
        }

        $user->save();

        return null;
    }

    private function saveAccount(User $user, array $data)
    {
        $user->scenario = User::SCENARIO_EDIT_ADMIN;

        if (array_key_exists('username', $data)) {
            $user->username = trim((string) $data['username']);
        }

        if (array_key_exists('email', $data)) {
            $user->email = trim((string) $data['email']);
        }

        if (!$user->save()) {
            return $this->fail(400, $this->firstError($user, 'Não foi possível salvar a conta.'));
        }

        return null;
    }

    private function savePassword(
        User $user,
        string $newPassword,
        string $currentPassword,
        bool $isSelf,
    ) {
        if ($isSelf && !CurrentPassword::matches($user, $currentPassword)) {
            return $this->fail(400, $currentPassword === ''
                ? 'Informe a senha atual.'
                : 'Senha atual incorreta.');
        }

        $password = Password::findOne(['user_id' => $user->id]) ?: new Password();
        $password->user_id = $user->id;
        $password->scenario = 'registration';
        $password->newPassword = $newPassword;
        $password->newPasswordConfirm = $newPassword;

        if (!$password->validate()) {
            return $this->fail(400, $this->firstError($password, 'Senha inválida.'));
        }

        $password->setPassword($newPassword);
        if (!$password->save()) {
            return $this->fail(400, $this->firstError($password, 'Não foi possível alterar a senha.'));
        }

        if ($isSelf && method_exists($user, 'setMustChangePassword')) {
            $user->setMustChangePassword(false);
        }

        return null;
    }

    private function readPassword(array $body): string
    {
        $password = $body['password'] ?? '';
        if (is_array($password)) {
            return trim((string) ($password['newPassword'] ?? ''));
        }

        return trim((string) $password);
    }

    private function readCurrentPassword(array $body): string
    {
        if (isset($body['currentPassword'])) {
            return trim((string) $body['currentPassword']);
        }

        $password = $body['password'] ?? '';
        if (is_array($password)) {
            return trim((string) ($password['currentPassword'] ?? ''));
        }

        return '';
    }

    private function toUser(User $user): array
    {
        $profile = $user->profile;

        return [
            'id' => (int) $user->id,
            'guid' => (string) $user->guid,
            'display_name' => (string) $user->displayName,
            'account' => [
                'username' => (string) $user->username,
                'email' => (string) $user->email,
                'tags' => method_exists($user, 'getTags') ? $user->getTags() : [],
                'language' => (string) $user->language,
                'time_zone' => (string) $user->time_zone,
                'visibility' => (int) $user->visibility,
                'status' => (int) $user->status,
                'last_login' => $user->last_login,
            ],
            'profile' => $this->profilePayload($user, $profile),
        ];
    }

    private function profilePayload(User $user, Profile $profile): array
    {
        $payload = ['image_url' => $this->imageUrl($user)];
        foreach (self::PROFILE_FIELDS as $field) {
            $payload[$field] = $this->profileValue($profile, $field);
        }

        return $payload;
    }

    private function profileValue(Profile $profile, string $field): string
    {
        if (!$profile->hasAttribute($field)) {
            return '';
        }

        return (string) ($profile->$field ?? '');
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

    private function firstError($model, string $fallback): string
    {
        $errors = $model->getFirstErrors();
        if (!$errors) {
            return $fallback;
        }

        return (string) reset($errors);
    }

    private function fail(int $status, string $message): array
    {
        Yii::$app->response->statusCode = $status;

        return ['message' => $message];
    }
}
