<?php

namespace humhub\modules\nexchat\assets;

use humhub\components\assets\AssetBundle;
use humhub\components\View;
use Yii;
use yii\helpers\Url;

class NexchatAsset extends AssetBundle
{
    public $sourcePath = '@nexchat/resources';

    public $publishOptions = ['forceCopy' => YII_DEBUG];

    public $css = [
        'css/nexchat.css',
    ];

    public $js = [
        'js/humhub.nexchat.js',
    ];

    public static function register($view)
    {
        /** @var View $view */
        $view->registerJsConfig('nexchat', [
            'sendUrl' => Url::to(['/nexchat/index/send']),
            'pollUrl' => Url::to(['/nexchat/index/poll']),
            'historyUrl' => Url::to(['/nexchat/index/load-history']),
            'updatesUrl' => Url::to(['/nexchat/index/updates']),
            'subscribeUrl' => Url::to(['/nexchat/index/subscribe-token']),
            'subscribeAllUrl' => Url::to(['/nexchat/index/subscribe-token']),
            'inviteUrl' => Url::to(['/nexchat/index/invite-member']),
            'acceptInviteUrl' => Url::to(['/nexchat/index/accept-invite']),
            'declineInviteUrl' => Url::to(['/nexchat/index/decline-invite']),
            'removeMemberUrl' => Url::to(['/nexchat/index/remove-member']),
            'renameChannelUrl' => Url::to(['/nexchat/index/rename-channel']),
            'deleteChannelUrl' => Url::to(['/nexchat/index/delete-channel']),
            'indexUrl' => Url::to(['/nexchat/index/index']),
            'openDmUrl' => Url::to(['/nexchat/index/open-dm']),
            'reactUrl' => Url::to(['/nexchat/index/react']),
            'editUrl' => Url::to(['/nexchat/index/edit']),
            'deleteUrl' => Url::to(['/nexchat/index/delete']),
            'editWindowSeconds' => \humhub\modules\nexchat\models\Message::EDIT_WINDOW_SECONDS,
            'currentUserId' => Yii::$app->user->isGuest ? 0 : (int) Yii::$app->user->id,
        ]);

        return parent::register($view);
    }
}
