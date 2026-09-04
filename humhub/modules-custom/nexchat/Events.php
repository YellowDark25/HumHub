<?php

namespace humhub\modules\nexchat;

use humhub\helpers\ControllerHelper;
use humhub\modules\nexchat\components\BearerLogin;
use humhub\modules\nexchat\components\NexchatNotificationLive;
use humhub\modules\nexchat\components\NexchatPasswordGate;
use humhub\modules\ui\menu\MenuLink;
use humhub\widgets\TopMenu;
use Yii;

class Events
{
    /**
     * Autentica Bearer nas rotas nexchat e desliga o log em banco.
     * O Yii grava warning/erro na tabela `log`; isso enche o volume do MySQL.
     * Desliga o DbTarget em todo request (web e console) e só então aplica o login.
     */
    public static function onBeforeRequest(): void
    {
        self::disableDatabaseLogTarget();

        $request = Yii::$app->request;
        if (!$request instanceof \yii\web\Request) {
            return;
        }

        $path = $request->pathInfo;
        if (!str_starts_with(ltrim($path, '/'), 'nexchat')) {
            return;
        }

        BearerLogin::authenticate();
    }

    /**
     * Impede o Yii de gravar na tabela `log`.
     * Percorre os targets do logger e desliga só o DbTarget; o FileTarget segue ativo.
     */
    public static function disableDatabaseLogTarget(): void
    {
        if (!Yii::$app->has('log')) {
            return;
        }

        foreach (Yii::$app->log->targets as $target) {
            if ($target instanceof \yii\log\DbTarget) {
                $target->enabled = false;
            }
        }
    }

    public static function onGateInit($event): void
    {
        $gateClass = 'humhub\\modules\\user\\components\\MustChangePasswordGate';
        if (!class_exists($gateClass) || !isset($event->manager)) {
            return;
        }

        $event->manager->deregister('must-change-password');
        $event->manager->register(new NexchatPasswordGate());
    }

    public static function onTopMenuInit($event)
    {
        if (Yii::$app->user->isGuest) {
            return;
        }

        /** @var TopMenu $topMenu */
        $topMenu = $event->sender;
        $topMenu->addEntry(new MenuLink([
            'id' => 'nexchat',
            'label' => 'Chat',
            'url' => ['/nexchat/index/index'],
            'icon' => 'comments',
            'sortOrder' => 300,
            'isActive' => ControllerHelper::isActivePath('nexchat'),
        ]));
    }

    public static function onPageBegin($event)
    {
        $view = $event->sender;
        if (!$view instanceof \yii\web\View) {
            return;
        }

        $css = <<<CSS
#topbar-first > .container {
    display: flex !important;
    align-items: center;
}
#topbar-first > .container > .topbar-brand {
    order: 1;
}
#topbar-first > .container > .notifications.position-absolute {
    position: static !important;
    left: auto !important;
    transform: none !important;
    margin: 0 0 0 auto !important;
    order: 2;
}
#topbar-first > .container > .topbar-actions {
    order: 3;
    margin-left: 16px;
}
CSS;

        $view->registerCss($css, [], 'nexchat-topbar-notifications');
    }

    public static function onNotificationSaved($event): void
    {
        if (!isset($event->sender)) {
            return;
        }

        NexchatNotificationLive::publishFromRecord($event->sender);
    }
}
