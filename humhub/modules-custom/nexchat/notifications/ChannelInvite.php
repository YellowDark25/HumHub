<?php

namespace humhub\modules\nexchat\notifications;

use humhub\helpers\Html;
use humhub\modules\notification\components\BaseNotification;
use Yii;
use yii\helpers\Url;

/**
 * Notifica um usuário quando ele é convidado para um canal do chat.
 */
class ChannelInvite extends BaseNotification
{
    public $moduleId = 'nexchat';

    public function category()
    {
        return new NexchatNotificationCategory();
    }

    public function getGroupKey()
    {
        return 'nexchat-invite-' . ($this->source ? (int) $this->source->id : 0);
    }

    public function html()
    {
        return Yii::t('NexchatModule.notifications', '{name} convidou você para o canal {channel}. Aceite para participar.', [
            'name' => Html::tag('strong', Html::encode($this->originator->displayName ?? 'Alguém')),
            'channel' => Html::tag('strong', '#' . Html::encode($this->source->name ?? 'canal')),
        ]);
    }

    public function getMailSubject()
    {
        return Yii::t('NexchatModule.notifications', '{name} convidou você para o canal {channel}.', [
            'name' => $this->originator->displayName ?? 'Alguém',
            'channel' => '#' . ($this->source->name ?? 'canal'),
        ]);
    }

    public function getUrl()
    {
        return Url::to(['/nexchat/index/index']);
    }
}
