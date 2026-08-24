<?php

namespace humhub\modules\nexchat\controllers;

use humhub\components\Controller;
use humhub\modules\nexchat\components\BearerLogin;
use humhub\modules\user\models\User;
use Yii;
use yii\web\Response;

class PeopleController extends Controller
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

    public function actionIndex()
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        $users = [];
        foreach ($this->visibleUsers() as $user) {
            $users[] = [
                'id' => (int) $user->id,
                'name' => (string) ($user->displayName ?? $user->username ?? 'Usuário'),
                'username' => (string) ($user->username ?? ''),
                'imageUrl' => $this->userImageUrl($user),
            ];
        }

        return ['users' => $users];
    }

    /**
     * @return User[]
     */
    private function visibleUsers(): array
    {
        return User::find()
            ->active()
            ->orderBy(['user.username' => SORT_ASC])
            ->limit(self::USER_LIMIT)
            ->all();
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
