<?php

namespace humhub\modules\nexchat\notifications;

use humhub\helpers\Html;
use humhub\modules\notification\components\BaseNotification;
use Yii;
use yii\helpers\Url;

/**
 * Notifica um usuário quando recebe uma mensagem direta (DM) no chat.
 */
class NewDmMessage extends BaseNotification
{
    public $moduleId = 'nexchat';

    public function category()
    {
        return new NexchatNotificationCategory();
    }

    public function getGroupKey()
    {
        $conversationId = $this->source ? (int) $this->source->conversation_id : 0;

        return 'nexchat-conv-' . $conversationId;
    }

    public function html()
    {
        return Yii::t('NexchatModule.notifications', '{displayName} te enviou uma mensagem.', [
            'displayName' => Html::tag('strong', Html::encode($this->originator->displayName ?? 'Alguém')),
        ]);
    }

    public function getMailSubject()
    {
        return Yii::t('NexchatModule.notifications', '{displayName} te enviou uma mensagem.', [
            'displayName' => $this->originator->displayName ?? 'Alguém',
        ]);
    }

    public function getUrl()
    {
        $conversationId = $this->source ? (int) $this->source->conversation_id : 0;

        return Url::to(['/nexchat/index/view', 'id' => $conversationId]);
    }
}
