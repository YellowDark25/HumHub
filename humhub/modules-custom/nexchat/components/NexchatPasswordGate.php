<?php

namespace humhub\modules\nexchat\components;

use humhub\modules\user\components\MustChangePasswordGate;

class NexchatPasswordGate extends MustChangePasswordGate
{
    public function getAllowedRoutes(): array
    {
        return array_merge(parent::getAllowedRoutes(), [
            'nexchat/account-password',
        ]);
    }
}
