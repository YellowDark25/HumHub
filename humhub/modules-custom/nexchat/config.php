<?php

use humhub\modules\nexchat\Module;
use humhub\widgets\TopMenu;

$events = [
    [
        'class' => yii\base\Application::class,
        'event' => yii\base\Application::EVENT_BEFORE_REQUEST,
        'callback' => ['humhub\\modules\\nexchat\\Events', 'onBeforeRequest'],
    ],
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
];

if (class_exists(\humhub\components\gates\GateManager::class)) {
    $events[] = [
        'class' => \humhub\components\gates\GateManager::class,
        'event' => \humhub\components\gates\GateManager::EVENT_INIT_GATES,
        'callback' => ['humhub\\modules\\nexchat\\Events', 'onGateInit'],
    ];
}

if (class_exists(\humhub\modules\notification\models\Notification::class)) {
    $events[] = [
        'class' => \humhub\modules\notification\models\Notification::class,
        'event' => \yii\db\BaseActiveRecord::EVENT_AFTER_INSERT,
        'callback' => ['humhub\\modules\\nexchat\\Events', 'onNotificationSaved'],
    ];
    $events[] = [
        'class' => \humhub\modules\notification\models\Notification::class,
        'event' => \yii\db\BaseActiveRecord::EVENT_AFTER_UPDATE,
        'callback' => ['humhub\\modules\\nexchat\\Events', 'onNotificationSaved'],
    ];
}

return [
    'id' => 'nexchat',
    'class' => Module::class,
    'namespace' => 'humhub\\modules\\nexchat',
    'events' => $events,
    'urlManagerRules' => [
        'nexchat' => 'nexchat/index/index',
        'nexchat/space-image/upload-image' => 'nexchat/space-image/upload-image',
        'nexchat/space-image/upload-banner' => 'nexchat/space-image/upload-banner',
        'nexchat/space-invite/users' => 'nexchat/space-invite/users',
        'nexchat/space-invite/send' => 'nexchat/space-invite/send',
        'nexchat/space-invite/received' => 'nexchat/space-invite/received',
        'nexchat/space-invite/accept' => 'nexchat/space-invite/accept',
        'nexchat/space-invite/decline' => 'nexchat/space-invite/decline',
        'nexchat/spaces' => 'nexchat/spaces/index',
        'nexchat/spaces/directory' => 'nexchat/spaces/directory',
        'nexchat/spaces/view' => 'nexchat/spaces/view',
        'nexchat/spaces/follow' => 'nexchat/spaces/follow',
        'nexchat/spaces/save-membership' => 'nexchat/spaces/save-membership',
        'nexchat/spaces/leave' => 'nexchat/spaces/leave',
        'nexchat/space-drive' => 'nexchat/space-drive/index',
        'nexchat/space-drive/folder' => 'nexchat/space-drive/create-folder',
        'nexchat/space-drive/delete-folder' => 'nexchat/space-drive/delete-folder',
        'nexchat/space-drive/upload' => 'nexchat/space-drive/upload',
        'nexchat/space-drive/delete-file' => 'nexchat/space-drive/delete-file',
        'nexchat/space-drive/file' => 'nexchat/space-drive/file',
        'nexchat/people' => 'nexchat/people/index',
        'nexchat/people/view' => 'nexchat/people/view',
        'nexchat/people/follow' => 'nexchat/people/follow',
        'nexchat/people/unfollow' => 'nexchat/people/unfollow',
        'nexchat/people/block' => 'nexchat/people/block',
        'nexchat/notification-live' => 'nexchat/notification-live/index',
        'nexchat/voice-live' => 'nexchat/voice-live/index',
        'nexchat/voice-live/publish' => 'nexchat/voice-live/publish',
        'nexchat/notification-settings' => 'nexchat/notification-settings/index',
        'nexchat/notification-settings/save' => 'nexchat/notification-settings/save',
        'nexchat/notification-settings/reset' => 'nexchat/notification-settings/reset',
        'nexchat/account-settings' => 'nexchat/account-settings/index',
        'nexchat/account-settings/save' => 'nexchat/account-settings/save',
        'nexchat/account-password/change' => 'nexchat/account-password/change',
        'nexchat/account-profile/save' => 'nexchat/account-profile/save',
        'nexchat/account-profile/image' => 'nexchat/account-profile/image',
        'nexchat/account-modules' => 'nexchat/account-modules/index',
        'nexchat/account-modules/enable' => 'nexchat/account-modules/enable',
        'nexchat/account-modules/disable' => 'nexchat/account-modules/disable',
        'nexchat/admin/modules' => 'nexchat/admin/modules',
        'nexchat/admin/modules/enable' => 'nexchat/admin/enable-module',
        'nexchat/admin/modules/disable' => 'nexchat/admin/disable-module',
        'nexchat/admin/pages' => 'nexchat/admin/pages',
        'nexchat/admin/information' => 'nexchat/admin/information',
        'nexchat/admin/settings' => 'nexchat/admin/settings',
        'nexchat/admin/settings/save' => 'nexchat/admin/save-settings',
        'nexchat/admin/groups' => 'nexchat/group/index',
        'nexchat/admin/groups/view' => 'nexchat/group/view',
        'nexchat/admin/groups/save' => 'nexchat/group/save',
        'nexchat/admin/groups/delete' => 'nexchat/group/delete',
        'nexchat/admin/groups/members' => 'nexchat/group/members',
        'nexchat/admin/groups/add-member' => 'nexchat/group/add-member',
        'nexchat/admin/groups/remove-member' => 'nexchat/group/remove-member',
        'nexchat/admin/groups/set-manager' => 'nexchat/group/set-manager',
        'nexchat/admin/groups/permissions' => 'nexchat/group/permissions',
        'nexchat/admin/groups/set-permission' => 'nexchat/group/set-permission',
        'nexchat/admin/profile-fields' => 'nexchat/profile/index',
        'nexchat/admin/profile-fields/category' => 'nexchat/profile/view-category',
        'nexchat/admin/profile-fields/save-category' => 'nexchat/profile/save-category',
        'nexchat/admin/profile-fields/delete-category' => 'nexchat/profile/delete-category',
        'nexchat/admin/profile-fields/field' => 'nexchat/profile/view-field',
        'nexchat/admin/profile-fields/save-field' => 'nexchat/profile/save-field',
        'nexchat/admin/profile-fields/delete-field' => 'nexchat/profile/delete-field',
    ],
];
