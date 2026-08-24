<?php

namespace humhub\modules\nexchat\notifications;

use humhub\helpers\Html;
use humhub\modules\notification\components\BaseNotification;
use Yii;
use yii\helpers\Url;

class NewChannelMessage extends BaseNotification
{
    public $moduleId = 'nexchat';

    public function category()
    {
        return new NexchatNotificationCategory();
    }

    public function getGroupKey()
    {
        $conversationId = $this->source ? (int) $this->source->conversation_id : 0;

        return 'nexchat-channel-' . $conversationId;
    }

    public function html()
    {
        return Yii::t('NexchatModule.notifications', '{displayName} enviou uma mensagem em {channel}.', [
            'displayName' => Html::tag('strong', Html::encode($this->originator->displayName ?? 'Alguém')),
            'channel' => Html::tag('strong', '#' . Html::encode($this->channelName())),
        ]);
    }

    public function getMailSubject()
    {
        return Yii::t('NexchatModule.notifications', '{displayName} enviou uma mensagem em #{channel}.', [
            'displayName' => $this->originator->displayName ?? 'Alguém',
            'channel' => $this->channelName(),
        ]);
    }

    public function getUrl()
    {
        $conversationId = $this->source ? (int) $this->source->conversation_id : 0;

        return Url::to(['/nexchat/index/view', 'id' => $conversationId]);
    }

    private function channelName(): string
    {
        if (!$this->source || !method_exists($this->source, 'conversation')) {
            return 'canal';
        }

        $conversation = $this->source->conversation;

        return $conversation?->name ?: 'canal';
    }
}
