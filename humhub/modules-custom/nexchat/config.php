<?php

use humhub\modules\nexchat\Module;
use humhub\widgets\TopMenu;

return [
    'id' => 'nexchat',
    'class' => Module::class,
    'namespace' => 'humhub\\modules\\nexchat',
    'events' => [
        [
            'class' => TopMenu::class,
            'event' => TopMenu::EVENT_INIT,
            'callback' => ['humhub\\modules\\nexchat\\Events', 'onTopMenuInit'],
        ],
        [
            'class' => yii\web\View::class,
            'event' => yii\web\View::EVENT_BEGIN_PAGE,
            'callback' => ['humhub\\modules\\nexchat\\Events', 'onPageBegin'],
        ],
    ],
    'urlManagerRules' => [
        'nexchat' => 'nexchat/index/index',
        'nexchat/space-image/upload-image' => 'nexchat/space-image/upload-image',
        'nexchat/space-image/upload-banner' => 'nexchat/space-image/upload-banner',
        'nexchat/notification-settings' => 'nexchat/notification-settings/index',
        'nexchat/notification-settings/save' => 'nexchat/notification-settings/save',
        'nexchat/notification-settings/reset' => 'nexchat/notification-settings/reset',
        'nexchat/account-settings' => 'nexchat/account-settings/index',
        'nexchat/account-settings/save' => 'nexchat/account-settings/save',
        'nexchat/account-modules' => 'nexchat/account-modules/index',
        'nexchat/account-modules/enable' => 'nexchat/account-modules/enable',
        'nexchat/account-modules/disable' => 'nexchat/account-modules/disable',
    ],
];
