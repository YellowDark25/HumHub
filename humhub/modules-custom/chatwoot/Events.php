<?php

namespace humhub\modules\chatwoot;

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

        /** @var Module $module */
        $module = Yii::$app->getModule('chatwoot');

        if (!$module->isConfigured()) {
            return;
        }

        if ($module->getVisibleTo() === 'admins' && !Yii::$app->user->isAdmin()) {
            return;
        }

        $htmlOptions = [];
        if ($module->openInNewTab()) {
            $htmlOptions = ['target' => '_blank', 'rel' => 'noopener noreferrer'];
        }

        /** @var TopMenu $topMenu */
        $topMenu = $event->sender;
        $topMenu->addEntry(new MenuLink([
            'id' => 'chatwoot',
            'label' => $module->getMenuLabel(),
            'url' => $module->getPanelUrl(),
            'icon' => 'headset',
            'sortOrder' => 310,
            'htmlOptions' => $htmlOptions,
        ]));
    }
}
