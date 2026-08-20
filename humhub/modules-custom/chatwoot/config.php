<?php

use humhub\modules\chatwoot\Module;
use humhub\widgets\TopMenu;

return [
    'id' => 'chatwoot',
    'class' => Module::class,
    'namespace' => 'humhub\\modules\\chatwoot',
    'events' => [
        [
            'class' => TopMenu::class,
            'event' => TopMenu::EVENT_INIT,
            'callback' => ['humhub\\modules\\chatwoot\\Events', 'onTopMenuInit'],
        ],
    ],
];
