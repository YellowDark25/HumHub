<?php

namespace humhub\modules\nexchat\controllers;

use humhub\components\Controller;
use humhub\modules\nexchat\components\BearerLogin;
use humhub\modules\notification\components\NotificationManager;
use humhub\modules\notification\models\forms\NotificationSettings;
use humhub\modules\space\models\Space;
use Yii;
use yii\web\Response;

class NotificationSettingsController extends Controller
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
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        return $this->payload();
    }

    public function actionSave()
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        $body = Yii::$app->request->getBodyParams();
        $spaceIds = $body['spaceIds'] ?? [];
        $channels = $body['channels'] ?? [];

        if (!is_array($spaceIds) || !is_array($channels)) {
            return $this->fail(400, 'Dados de notificação inválidos.');
        }

        $user = Yii::$app->user->identity;
        Yii::$app->notification->setSpaces($this->spaceGuids($spaceIds), $user);

        $settings = Yii::$app->getModule('notification')->settings->user($user);
        $settings->set(NotificationManager::IS_TOUCHED_SETTINGS, true);

        $targets = $this->targetsById($user);
        $web = $targets['web'] ?? null;
        $mail = $targets['mail'] ?? null;

        foreach (Yii::$app->notification->getNotificationCategories($user) as $category) {
            $channel = $channels[$category->id] ?? null;
            if (!is_array($channel)) {
                continue;
            }

            if ($web && $web->isEditable($user) && !$category->isFixedSetting($web)) {
                $settings->set($web->getSettingKey($category), !empty($channel['web']));
            }

            if ($mail && $mail->isEditable($user) && !$category->isFixedSetting($mail)) {
                $settings->set($mail->getSettingKey($category), !empty($channel['email']));
            }
        }

        return $this->payload();
    }

    public function actionReset()
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        $model = new NotificationSettings(['user' => Yii::$app->user->identity]);
        $model->resetUserSettings();

        return $this->payload();
    }

    private function payload(): array
    {
        $user = Yii::$app->user->identity;
        $targets = $this->targetsById($user);
        $web = $targets['web'] ?? null;
        $mail = $targets['mail'] ?? null;
        $categories = [];

        foreach (Yii::$app->notification->getNotificationCategories($user) as $category) {
            $categories[] = [
                'id' => $category->id,
                'title' => $category->getTitle(),
                'description' => $category->getDescription(),
                'web' => $web ? $web->isCategoryEnabled($category, $user) : false,
                'email' => $mail ? $mail->isCategoryEnabled($category, $user) : false,
                'webEditable' => $web && $web->isEditable($user) && !$category->isFixedSetting($web),
                'emailEditable' => $mail && $mail->isEditable($user) && !$category->isFixedSetting($mail),
            ];
        }

        $spaceIds = [];
        foreach (Yii::$app->notification->getSpaces($user) as $space) {
            $spaceIds[] = (int) $space->id;
        }

        return [
            'spaceIds' => $spaceIds,
            'categories' => $categories,
        ];
    }

    private function targetsById($user): array
    {
        $targets = [];
        foreach (Yii::$app->notification->getTargets($user) as $target) {
            $targets[$target->id] = $target;
        }

        return $targets;
    }

    private function spaceGuids(array $spaceIds): array
    {
        $guids = [];
        foreach ($spaceIds as $spaceId) {
            $space = Space::findOne(['id' => (int) $spaceId]);
            if ($space) {
                $guids[] = $space->guid;
            }
        }

        return $guids;
    }

    private function fail(int $status, string $message): array
    {
        Yii::$app->response->statusCode = $status;

        return ['message' => $message];
    }
}
