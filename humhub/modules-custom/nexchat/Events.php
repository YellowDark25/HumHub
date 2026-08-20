<?php

namespace humhub\modules\nexchat;

use humhub\helpers\ControllerHelper;
use humhub\modules\ui\menu\MenuLink;
use humhub\widgets\TopMenu;
use Yii;

class Events
{
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
}
