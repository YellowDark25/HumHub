<?php

namespace humhub\modules\nexchat\notifications;

use humhub\helpers\Html;
use humhub\modules\notification\components\BaseNotification;
use Yii;
use yii\helpers\Url;

class FriendshipRequestNotification extends BaseNotification
{
    public $moduleId = 'nexchat';

    public function category()
    {
        return new NexchatNotificationCategory();
    }

    public function getGroupKey()
    {
        return 'nexchat-friend-request-' . ($this->originator ? (int) $this->originator->id : 0);
    }

    public function html()
    {
        return Yii::t('NexchatModule.notifications', '{name} enviou um pedido de amizade.', [
            'name' => Html::tag('strong', Html::encode($this->originator->displayName ?? 'Alguém')),
        ]);
    }

    public function getMailSubject()
    {
        return Yii::t('NexchatModule.notifications', '{name} enviou um pedido de amizade.', [
            'name' => $this->originator->displayName ?? 'Alguém',
        ]);
    }

    public function getUrl()
    {
        return Url::to(['/user/people']);
    }
}
