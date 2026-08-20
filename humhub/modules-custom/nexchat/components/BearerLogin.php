<?php

namespace humhub\modules\nexchat\components;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use humhub\modules\user\models\User;
use Yii;
use yii\web\JsonParser;

class BearerLogin
{
    public static function authenticate(): void
    {
        $header = (string) Yii::$app->request->headers->get('Authorization', '');
        if (!preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
            return;
        }

        if (!Yii::$app->hasModule('rest')) {
            return;
        }

        $jwtKey = (string) Yii::$app->getModule('rest')->settings->get('jwtKey', '');
        if ($jwtKey === '') {
            return;
        }

        try {
            $payload = JWT::decode($matches[1], new Key($jwtKey, 'HS512'));
        } catch (\Throwable $e) {
            Yii::warning($e->getMessage(), 'nexchat');
            return;
        }

        $userId = (int) ($payload->uid ?? 0);
        if ($userId <= 0) {
            return;
        }

        $identity = User::find()->active()->andWhere(['user.id' => $userId])->one();
        if (!$identity) {
            return;
        }

        Yii::$app->user->login($identity);
        if (method_exists(Yii::$app->i18n, 'setUserLocale')) {
            Yii::$app->i18n->setUserLocale($identity);
        } elseif (!empty($identity->language)) {
            Yii::$app->language = $identity->language;
        }
        Yii::$app->request->parsers['application/json'] = JsonParser::class;
        Yii::$app->request->setBodyParams(null);
    }

    public static function hasBearer(): bool
    {
        $header = (string) Yii::$app->request->headers->get('Authorization', '');

        return (bool) preg_match('/^Bearer\s+.+/i', $header);
    }
}
