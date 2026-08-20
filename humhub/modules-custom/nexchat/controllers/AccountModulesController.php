<?php

namespace humhub\modules\nexchat\controllers;

use humhub\components\Controller;
use humhub\modules\content\components\ContentContainerModule;
use humhub\modules\nexchat\components\BearerLogin;
use Yii;
use yii\web\Response;

class AccountModulesController extends Controller
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

    public function actionEnable()
    {
        return $this->toggle(true);
    }

    public function actionDisable()
    {
        return $this->toggle(false);
    }

    private function toggle(bool $enable): array
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        $moduleId = trim((string) (Yii::$app->request->getBodyParams()['moduleId'] ?? ''));
        if ($moduleId === '') {
            return $this->fail(400, 'Informe o módulo.');
        }

        $manager = Yii::$app->user->identity->moduleManager;
        $canChange = $enable ? $manager->canEnable($moduleId) : $manager->canDisable($moduleId);
        if (!$canChange) {
            $action = $enable ? 'habilitar' : 'desativar';

            return $this->fail(400, "Não foi possível {$action} este módulo.");
        }

        if ($enable) {
            $manager->enable($moduleId);
        } else {
            $manager->disable($moduleId);
        }

        return $this->payload();
    }

    private function payload(): array
    {
        $user = Yii::$app->user->identity;
        if (method_exists(Yii::$app->i18n, 'setUserLocale')) {
            Yii::$app->i18n->setUserLocale($user);
        }

        $manager = $user->moduleManager;
        $modules = [];

        foreach ($manager->getAvailable() as $module) {
            if (!$module instanceof ContentContainerModule) {
                continue;
            }

            $configUrl = trim((string) $module->getContentContainerConfigUrl($user));
            $modules[] = [
                'id' => $module->id,
                'name' => $module->getContentContainerName($user),
                'version' => method_exists($module, 'getVersion') ? (string) $module->getVersion() : '',
                'description' => $module->getContentContainerDescription($user),
                'imageUrl' => $this->absoluteUrl((string) $module->getContentContainerImage($user)),
                'isEnabled' => $manager->isEnabled($module->id),
                'canEnable' => $manager->canEnable($module->id),
                'canDisable' => $manager->canDisable($module->id),
                'configUrl' => $configUrl === '' ? null : $this->absoluteUrl($configUrl),
            ];
        }

        return ['modules' => $modules];
    }

    private function absoluteUrl(string $url): string
    {
        $trimmed = trim($url);
        if ($trimmed === '') {
            return '';
        }

        if (str_starts_with($trimmed, 'http://') || str_starts_with($trimmed, 'https://')) {
            return $trimmed;
        }

        return rtrim(Yii::$app->request->hostInfo . Yii::$app->request->baseUrl, '/')
            . '/'
            . ltrim($trimmed, '/');
    }

    private function fail(int $status, string $message): array
    {
        Yii::$app->response->statusCode = $status;

        return ['message' => $message];
    }
}
