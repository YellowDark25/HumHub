<?php

namespace humhub\modules\nexchat\components;

use humhub\modules\user\models\Password;
use humhub\modules\user\models\User;
use Yii;

class CurrentPassword
{
    public static function matches(User $user, string $plain): bool
    {
        if ($plain === '') {
            return false;
        }

        $stored = Password::findOne(['user_id' => $user->id]);
        if (!$stored) {
            return false;
        }

        if (method_exists($stored, 'validatePassword')) {
            return (bool) $stored->validatePassword($plain);
        }

        $hash = (string) ($stored->password ?? '');
        if ($hash === '') {
            return false;
        }

        return Yii::$app->security->validatePassword($plain, $hash);
    }
}
