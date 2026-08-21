<?php

namespace humhub\modules\nexchat\notifications;

use humhub\helpers\Html;
use humhub\modules\notification\components\BaseNotification;
use Yii;
use yii\helpers\Url;

class SpaceInviteNotification extends BaseNotification
{
    public $moduleId = 'nexchat';

    public function category()
    {
        return new NexchatNotificationCategory();
    }

    public function getGroupKey()
    {
        return 'nexchat-space-invite-' . ($this->source ? (int) $this->source->id : 0);
    }

    public function html()
    {
        return Yii::t('NexchatModule.notifications', '{name} convidou você para o espaço {space}.', [
            'name' => Html::tag('strong', Html::encode($this->originator->displayName ?? 'Alguém')),
            'space' => Html::tag('strong', Html::encode($this->source->name ?? 'espaço')),
        ]);
    }

    public function getMailSubject()
    {
        return Yii::t('NexchatModule.notifications', '{name} convidou você para o espaço {space}.', [
            'name' => $this->originator->displayName ?? 'Alguém',
            'space' => $this->source->name ?? 'espaço',
        ]);
    }

    public function getUrl()
    {
        return Url::to(['/user/profile']);
    }
}
