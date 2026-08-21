<?php

namespace humhub\modules\nexchat\notifications;

use humhub\modules\notification\components\NotificationCategory;
use humhub\modules\notification\targets\BaseTarget;
use humhub\modules\notification\targets\MailTarget;
use Yii;

class NexchatNotificationCategory extends NotificationCategory
{
    public $id = 'nexchat';

    public function getDefaultSetting(BaseTarget $target)
    {
        if ($target instanceof MailTarget) {
            return false;
        }

        return parent::getDefaultSetting($target);
    }

    public function getTitle()
    {
        return Yii::t('NexchatModule.notifications', 'Chat');
    }

    public function getDescription()
    {
        return Yii::t('NexchatModule.notifications', 'Receba notificações de mensagens diretas e convites para canais e espaços.');
    }
}
