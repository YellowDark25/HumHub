<?php

namespace humhub\modules\nexchat\controllers;

use DateTimeZone;
use humhub\components\Controller;
use humhub\modules\nexchat\components\BearerLogin;
use Yii;
use yii\web\Response;

class AdminController extends Controller
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

    public function actionModules()
    {
        $denied = $this->requireAdmin();
        if ($denied !== null) {
            return $denied;
        }

        return $this->modulesPayload();
    }

    public function actionEnableModule()
    {
        return $this->toggleModule(true);
    }

    public function actionDisableModule()
    {
        return $this->toggleModule(false);
    }

    public function actionPages()
    {
        $denied = $this->requireAdmin();
        if ($denied !== null) {
            return $denied;
        }

        return ['pages' => $this->customPages()];
    }

    public function actionInformation()
    {
        $denied = $this->requireAdmin();
        if ($denied !== null) {
            return $denied;
        }

        return [
            'appName' => (string) Yii::$app->name,
            'version' => (string) Yii::$app->version,
            'phpVersion' => PHP_VERSION,
            'databaseDriver' => (string) Yii::$app->db->driverName,
            'databaseName' => $this->databaseName(),
            'baseUrl' => (string) Yii::$app->settings->get('baseUrl'),
            'isDebug' => defined('YII_DEBUG') && YII_DEBUG,
        ];
    }

    public function actionSettings()
    {
        $denied = $this->requireAdmin();
        if ($denied !== null) {
            return $denied;
        }

        return $this->settingsPayload();
    }

    public function actionSaveSettings()
    {
        $denied = $this->requireAdmin();
        if ($denied !== null) {
            return $denied;
        }

        $body = Yii::$app->request->getBodyParams();
        $name = trim((string) ($body['name'] ?? ''));
        $baseUrl = rtrim(trim((string) ($body['baseUrl'] ?? '')), '/');
        $defaultLanguage = trim((string) ($body['defaultLanguage'] ?? ''));
        $timeZone = trim((string) ($body['timeZone'] ?? ''));

        if ($name === '' || $baseUrl === '' || $defaultLanguage === '' || $timeZone === '') {
            return $this->fail(400, 'Preencha nome, URL base, idioma e fuso horário.');
        }

        Yii::$app->settings->set('name', $name);
        Yii::$app->settings->set('baseUrl', $baseUrl);
        Yii::$app->settings->set('defaultLanguage', $defaultLanguage);
        Yii::$app->settings->set('timeZone', $timeZone);
        Yii::$app->settings->set('maintenanceMode', !empty($body['maintenanceMode']) ? '1' : '0');

        return $this->settingsPayload();
    }

    private function toggleModule(bool $enable): array
    {
        $denied = $this->requireAdmin();
        if ($denied !== null) {
            return $denied;
        }

        $moduleId = trim((string) (Yii::$app->request->getBodyParams()['moduleId'] ?? ''));
        if ($moduleId === '') {
            return $this->fail(400, 'Informe o módulo.');
        }

        if ($moduleId === 'rest') {
            return $this->fail(400, 'O módulo REST não pode ser alterado por aqui.');
        }

        $manager = Yii::$app->moduleManager;
        try {
            if ($enable) {
                $manager->enable($moduleId);
            } else {
                $manager->disable($moduleId);
            }
        } catch (\Throwable $error) {
            $action = $enable ? 'habilitar' : 'desativar';
            Yii::warning($error->getMessage(), 'nexchat');

            return $this->fail(400, "Não foi possível {$action} este módulo.");
        }

        return $this->modulesPayload();
    }

    private function modulesPayload(): array
    {
        $modules = [];
        $registered = Yii::$app->moduleManager->getModules(['includeCoreModules' => true]);
        foreach ($registered as $id => $module) {
            if (!is_object($module) || !isset($module->id)) {
                continue;
            }

            $enabled = Yii::$app->hasModule($module->id);
            $core = method_exists(Yii::$app->moduleManager, 'isCoreModule')
                && Yii::$app->moduleManager->isCoreModule($module->id);
            $protected = $module->id === 'rest';

            $modules[] = [
                'id' => $module->id,
                'name' => method_exists($module, 'getName') ? (string) $module->getName() : (string) $id,
                'version' => method_exists($module, 'getVersion') ? (string) $module->getVersion() : '',
                'description' => method_exists($module, 'getDescription') ? (string) $module->getDescription() : '',
                'isEnabled' => $enabled,
                'canEnable' => !$enabled && !$core,
                'canDisable' => $enabled && !$core && !$protected,
            ];
        }

        usort($modules, static fn ($left, $right) => strcasecmp($left['name'], $right['name']));

        return ['modules' => $modules];
    }

    private function customPages(): array
    {
        $class = 'humhub\\modules\\custom_pages\\models\\CustomPage';
        if (!Yii::$app->hasModule('custom_pages') || !class_exists($class)) {
            return [];
        }

        try {
            $pages = [];
            foreach ($class::find()->all() as $page) {
                $container = $page->content->container ?? null;
                if ($container !== null) {
                    continue;
                }

                $pages[] = [
                    'id' => (int) $page->id,
                    'title' => (string) ($page->title ?? ''),
                    'type' => (string) ($page->type ?? ''),
                    'target' => (string) ($page->target ?? ''),
                    'isAdminOnly' => (bool) ($page->admin_only ?? false),
                ];
            }

            return $pages;
        } catch (\Throwable $error) {
            Yii::warning($error->getMessage(), 'nexchat');

            return [];
        }
    }

    private function settingsPayload(): array
    {
        return [
            'name' => (string) Yii::$app->settings->get('name'),
            'baseUrl' => (string) Yii::$app->settings->get('baseUrl'),
            'defaultLanguage' => (string) Yii::$app->settings->get('defaultLanguage') ?: 'pt-BR',
            'timeZone' => (string) Yii::$app->settings->get('timeZone') ?: 'America/Sao_Paulo',
            'maintenanceMode' => (bool) Yii::$app->settings->get('maintenanceMode'),
            'languages' => $this->languageOptions(),
            'timeZones' => $this->timeZoneOptions(),
        ];
    }

    private function languageOptions(): array
    {
        $allowed = Yii::$app->params['availableLanguages'] ?? [
            'en-US' => 'English (US)',
            'pt-BR' => 'Português (Brasil)',
        ];

        $options = [];
        foreach ($allowed as $value => $label) {
            $options[] = [
                'value' => (string) $value,
                'label' => (string) $label,
            ];
        }

        return $options;
    }

    private function timeZoneOptions(): array
    {
        $options = [];
        foreach (DateTimeZone::listIdentifiers() as $zone) {
            $options[] = [
                'value' => $zone,
                'label' => $zone,
            ];
        }

        return $options;
    }

    private function databaseName(): string
    {
        $dsn = (string) Yii::$app->db->dsn;
        if (preg_match('/dbname=([^;]+)/', $dsn, $matches)) {
            return $matches[1];
        }

        return '';
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
