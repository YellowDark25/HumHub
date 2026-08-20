<?php

namespace humhub\modules\nexchat\controllers;

use DateTimeZone;
use humhub\components\Controller;
use humhub\modules\nexchat\components\BearerLogin;
use humhub\modules\user\models\forms\AccountSettings;
use humhub\modules\user\models\User;
use Yii;
use yii\web\Response;

class AccountSettingsController extends Controller
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

        $user = Yii::$app->user->identity;
        $model = $this->formModel($user);
        $body = Yii::$app->request->getBodyParams();

        $model->tags = $this->stringList($body['tags'] ?? []);
        $model->language = trim((string) ($body['language'] ?? ''));
        $model->timeZone = trim((string) ($body['timeZone'] ?? ''));
        $model->visibility = (int) ($body['visibility'] ?? $user->visibility);
        $model->hideOnlineStatus = !empty($body['hideOnlineStatus']);
        $model->show_introduction_tour = !empty($body['hideTourPanel']);
        $model->markdownEditorMode = (int) ($body['markdownEditorMode'] ?? 0);
        $model->blockedUsers = $this->blockedGuids($body['blockedUserIds'] ?? []);

        if (!$model->validate()) {
            $errors = $model->getFirstErrors();

            return $this->fail(400, reset($errors) ?: 'Dados inválidos.');
        }

        $user->settings->set('hideOnlineStatus', $model->hideOnlineStatus);
        $user->settings->set('markdownEditorMode', $model->markdownEditorMode);
        $this->setTourHidden($user, (bool) $model->show_introduction_tour);

        $user->scenario = User::SCENARIO_EDIT_ACCOUNT_SETTINGS;
        $user->language = $model->language;
        $user->tagsField = $model->tags;
        $user->time_zone = $model->timeZone;
        if ($model->isVisibilityViewable() && $model->isVisibilityEditable()) {
            $user->visibility = $model->visibility;
        }
        if ($this->canBlockUsers()) {
            $user->blockedUsersField = $model->blockedUsers;
        }

        if (!$user->save()) {
            $errors = $user->getFirstErrors();

            return $this->fail(400, reset($errors) ?: 'Não foi possível salvar as configurações.');
        }

        return $this->payload();
    }

    private function payload(): array
    {
        $user = Yii::$app->user->identity;
        $model = $this->formModel($user);
        $userModule = Yii::$app->getModule('user');

        return [
            'tags' => $model->getTags(),
            'language' => $model->language,
            'timeZone' => $model->timeZone,
            'visibility' => (int) $model->visibility,
            'hideOnlineStatus' => (bool) $model->hideOnlineStatus,
            'hideTourPanel' => (bool) $model->show_introduction_tour,
            'markdownEditorMode' => (int) $model->markdownEditorMode,
            'blockedUsers' => $this->blockedUsersPayload($user),
            'languages' => $this->options($this->languages()),
            'timeZones' => $this->options($this->timeZones()),
            'visibilityOptions' => $this->options($model->getVisibilityOptions()),
            'editorModes' => $this->options($model->getEditorModeList()),
            'showVisibility' => $model->isVisibilityViewable(),
            'visibilityEditable' => $model->isVisibilityEditable(),
            'showOnlineStatus' => !(bool) $userModule->settings->get('auth.hideOnlineStatus'),
            'showTourPanel' => $this->isTourEnabled(),
            'showBlockedUsers' => $this->canBlockUsers(),
        ];
    }

    private function formModel(User $user): AccountSettings
    {
        $model = new AccountSettings(['user' => $user]);
        $model->language = Yii::$app->i18n->getAllowedLanguage($user->language);
        $model->timeZone = $user->time_zone ?: Yii::$app->settings->get('defaultTimeZone');
        $model->tags = $user->getTags();
        $model->hideOnlineStatus = $user->settings->get('hideOnlineStatus');
        $model->markdownEditorMode = $user->settings->get('markdownEditorMode');
        $model->show_introduction_tour = $this->isTourHidden($user);
        $model->visibility = $user->visibility;
        $model->blockedUsers = method_exists($user, 'getBlockedUserGuids')
            ? $user->getBlockedUserGuids()
            : [];

        return $model;
    }

    private function languages(): array
    {
        $languages = Yii::$app->i18n->getAllowedLanguages();
        if (class_exists(\Collator::class)) {
            $collator = new \Collator(Yii::$app->language);
            $collator->asort($languages);
        }

        return $languages;
    }

    private function timeZones(): array
    {
        foreach ([
            'humhub\\libs\\TimezoneHelper',
            'humhub\\helpers\\TimezoneHelper',
        ] as $className) {
            if (class_exists($className) && method_exists($className, 'generateList')) {
                return $className::generateList(true);
            }
        }

        $zones = [];
        foreach (DateTimeZone::listIdentifiers() as $zone) {
            $zones[$zone] = $zone;
        }

        return $zones;
    }

    private function options(array $items): array
    {
        $options = [];
        foreach ($items as $value => $label) {
            $options[] = [
                'value' => (string) $value,
                'label' => (string) $label,
            ];
        }

        return $options;
    }

    private function stringList($value): array
    {
        if (!is_array($value)) {
            return [];
        }

        $items = [];
        foreach ($value as $item) {
            $trimmed = trim((string) $item);
            if ($trimmed !== '') {
                $items[] = $trimmed;
            }
        }

        return array_values(array_unique($items));
    }

    private function blockedGuids($ids): array
    {
        if (!is_array($ids) || !$this->canBlockUsers()) {
            return [];
        }

        $guids = [];
        foreach ($ids as $id) {
            $blocked = User::findOne(['id' => (int) $id]);
            if ($blocked) {
                $guids[] = $blocked->guid;
            }
        }

        return $guids;
    }

    private function blockedUsersPayload(User $user): array
    {
        if (!$this->canBlockUsers() || !method_exists($user, 'getBlockedUsers')) {
            return [];
        }

        $query = $user->getBlockedUsers();
        $blockedList = is_object($query) && method_exists($query, 'all')
            ? $query->all()
            : (array) $query;

        $users = [];
        foreach ($blockedList as $blocked) {
            $users[] = [
                'id' => (int) $blocked->id,
                'name' => $blocked->displayName,
            ];
        }

        return $users;
    }

    private function canBlockUsers(): bool
    {
        $module = Yii::$app->getModule('user');

        return $module && method_exists($module, 'allowBlockUsers') && $module->allowBlockUsers();
    }

    private function isTourEnabled(): bool
    {
        $module = $this->tourModule();

        return $module && (int) $module->settings->get('enable') === 1;
    }

    private function isTourHidden(User $user): bool
    {
        $module = $this->tourModule();
        if (!$module) {
            return false;
        }

        return (bool) $module->settings->contentContainer($user)->get('hideTourPanel');
    }

    private function setTourHidden(User $user, bool $hidden): void
    {
        $module = $this->tourModule();
        if (!$module) {
            return;
        }

        $module->settings->contentContainer($user)->set('hideTourPanel', $hidden);
    }

    private function tourModule()
    {
        return Yii::$app->hasModule('tour') ? Yii::$app->getModule('tour') : null;
    }

    private function fail(int $status, string $message): array
    {
        Yii::$app->response->statusCode = $status;

        return ['message' => $message];
    }
}
