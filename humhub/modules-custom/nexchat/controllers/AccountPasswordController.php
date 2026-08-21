<?php

namespace humhub\modules\nexchat\controllers;

use humhub\components\Controller;
use humhub\modules\nexchat\components\BearerLogin;
use humhub\modules\nexchat\components\SkipMustChangePasswordAccess;
use humhub\modules\user\models\Password;
use humhub\modules\user\models\User;
use Yii;
use yii\web\Response;

class AccountPasswordController extends Controller
{
    public $enableCsrfValidation = false;

    public $layout = false;

    protected $access = SkipMustChangePasswordAccess::class;

    public function beforeAction($action)
    {
        BearerLogin::authenticate();
        if (BearerLogin::hasBearer()) {
            $this->enableCsrfValidation = false;
        }

        Yii::$app->response->format = Response::FORMAT_JSON;

        return parent::beforeAction($action);
    }

    public function actionChange()
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        /** @var User $user */
        $user = Yii::$app->user->identity;
        $body = Yii::$app->request->getBodyParams();
        $password = Password::findOne(['user_id' => $user->id]) ?: new Password();
        $password->user_id = $user->id;
        $password->scenario = 'registration';
        $password->newPassword = (string) ($body['newPassword'] ?? '');
        $password->newPasswordConfirm = (string) ($body['newPasswordConfirm'] ?? '');

        if (!$password->validate()) {
            $errors = $password->getFirstErrors();

            return $this->fail(400, reset($errors) ?: 'Senha inválida.');
        }

        $password->setPassword($password->newPassword);
        if (!$password->save()) {
            $errors = $password->getFirstErrors();

            return $this->fail(400, reset($errors) ?: 'Não foi possível alterar a senha.');
        }

        $user->setMustChangePassword(false);

        return ['ok' => true];
    }

    private function fail(int $status, string $message): array
    {
        Yii::$app->response->statusCode = $status;

        return ['message' => $message];
    }
}
