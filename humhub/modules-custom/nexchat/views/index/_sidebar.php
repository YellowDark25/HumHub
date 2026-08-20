<?php

use humhub\modules\nexchat\models\Conversation;
use humhub\modules\nexchat\models\Membership;
use yii\helpers\Html;
use yii\helpers\Url;

/* @var $this \humhub\components\View */
/* @var $channelConversations Conversation[] */
/* @var $dmConversations Conversation[] */
/* @var $pendingInvites Conversation[] */
/* @var $users \humhub\modules\user\models\User[] */
/* @var $activeConversation Conversation|null */

$pendingInvites = $pendingInvites ?? [];
?>
<aside class="nexchat-sidebar">
    <div class="nexchat-sidebar-header">
        <span class="nexchat-logo">Chat</span>
    </div>

    <?php if (!empty($pendingInvites)): ?>
        <div class="nexchat-sidebar-section nexchat-invites-section">
            <div class="nexchat-section-title">Convites</div>
            <?php foreach ($pendingInvites as $invite): ?>
                <div class="nexchat-invite-item" data-conversation-id="<?= (int) $invite->id ?>">
                    <div class="nexchat-invite-channel">
                        <span class="nexchat-hash">#</span>
                        <span class="nexchat-item-label"><?= Html::encode($invite->name) ?></span>
                    </div>
                    <div class="nexchat-invite-actions">
                        <button type="button" class="nexchat-invite-accept" data-conversation-id="<?= (int) $invite->id ?>">Aceitar</button>
                        <button type="button" class="nexchat-invite-decline" data-conversation-id="<?= (int) $invite->id ?>">Recusar</button>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <div class="nexchat-sidebar-section">
        <div class="nexchat-section-title">Canais</div>
        <div class="nexchat-channel-list" id="nexchat-channel-list">
            <?php if (empty($channelConversations)): ?>
                <div class="nexchat-empty-item">Nenhum canal</div>
            <?php else: ?>
                <?php foreach ($channelConversations as $conversation): ?>
                    <a
                        href="<?= Url::to(['/nexchat/index/view', 'id' => $conversation->id]) ?>"
                        class="nexchat-sidebar-item<?= ($activeConversation && (int) $activeConversation->id === (int) $conversation->id) ? ' active' : '' ?>"
                        data-conversation-id="<?= (int) $conversation->id ?>"
                        data-conversation-type="channel"
                        data-pjax-prevent
                    >
                        <span class="nexchat-hash">#</span>
                        <span class="nexchat-item-label"><?= Html::encode($conversation->name) ?></span>
                        <span class="nexchat-unread-badge" hidden>0</span>
                    </a>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>

        <form class="nexchat-inline-form" method="post" action="<?= Url::to(['/nexchat/index/create-channel']) ?>">
            <?= Html::hiddenInput(Yii::$app->request->csrfParam, Yii::$app->request->csrfToken) ?>
            <input type="text" name="name" placeholder="+ novo canal" maxlength="100" required>
        </form>
    </div>

    <div class="nexchat-sidebar-section">
        <div class="nexchat-section-title">Mensagens diretas</div>
        <div class="nexchat-dm-list" id="nexchat-dm-list">
            <?php if (empty($dmConversations)): ?>
                <div class="nexchat-empty-item">Nenhuma DM</div>
            <?php else: ?>
                <?php foreach ($dmConversations as $conversation): ?>
                    <a
                        href="<?= Url::to(['/nexchat/index/view', 'id' => $conversation->id]) ?>"
                        class="nexchat-sidebar-item<?= ($activeConversation && (int) $activeConversation->id === (int) $conversation->id) ? ' active' : '' ?>"
                        data-conversation-id="<?= (int) $conversation->id ?>"
                        data-conversation-type="dm"
                        data-pjax-prevent
                    >
                        <span class="nexchat-dm-icon">@</span>
                        <span class="nexchat-item-label"><?= Html::encode($conversation->getDisplayName()) ?></span>
                        <span class="nexchat-unread-badge" hidden>0</span>
                    </a>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>

        <form class="nexchat-inline-form" method="post" action="<?= Url::to(['/nexchat/index/start-dm']) ?>">
            <?= Html::hiddenInput(Yii::$app->request->csrfParam, Yii::$app->request->csrfToken) ?>
            <select name="user_id" required>
                <option value="">+ nova DM</option>
                <?php foreach ($users as $user): ?>
                    <option value="<?= (int) $user->id ?>"><?= Html::encode($user->displayName) ?></option>
                <?php endforeach; ?>
            </select>
        </form>
    </div>
</aside>
