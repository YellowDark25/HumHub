<?php

use humhub\modules\nexchat\models\Conversation;
use humhub\modules\nexchat\models\Membership;
use humhub\modules\nexchat\models\Message;
use yii\helpers\Html;

/* @var $this \humhub\components\View */
/* @var $conversation Conversation */
/* @var $messages Message[] */
/* @var $hasMoreHistory bool */
/* @var $oldestMessageId int */
/* @var $memberships Membership[] */
/* @var $isChannelAdmin bool */
/* @var $invitableUsers \humhub\modules\user\models\User[] */

$lastMessageId = 0;
if (!empty($messages)) {
    $lastMessageId = (int) end($messages)->id;
}

$this->beginContent('@nexchat/views/index/_layout.php');
?>
<?php $canModerate = ($conversation->type === Conversation::TYPE_CHANNEL) && !empty($isChannelAdmin); ?>
<div
    class="nexchat-chat"
    data-nexchat-conversation="<?= (int) $conversation->id ?>"
    data-last-message-id="<?= $lastMessageId ?>"
    data-oldest-message-id="<?= (int) $oldestMessageId ?>"
    data-has-more-history="<?= $hasMoreHistory ? '1' : '0' ?>"
    data-can-moderate="<?= $canModerate ? '1' : '0' ?>"
>
    <header class="nexchat-chat-header">
        <div class="nexchat-chat-title">
            <?php if ($conversation->type === Conversation::TYPE_CHANNEL): ?>
                <span class="nexchat-hash">#</span>
            <?php else: ?>
                <span class="nexchat-dm-icon">@</span>
            <?php endif; ?>
            <?= Html::encode($conversation->getDisplayName()) ?>
        </div>
        <?php if ($conversation->type === Conversation::TYPE_CHANNEL): ?>
            <div class="nexchat-header-right">
                <div class="nexchat-chat-meta"><?= count($memberships) ?> membro(s)</div>
                <?php if ($canModerate): ?>
                    <button type="button" id="nexchat-open-invite" class="nexchat-header-btn" title="Convidar pessoas">
                        <i class="fa fa-user-plus"></i>
                    </button>
                    <button type="button" id="nexchat-open-settings" class="nexchat-header-btn" title="Configurações do canal">
                        <i class="fa fa-cog"></i>
                    </button>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </header>

    <div class="nexchat-chat-body">
        <div id="nexchat-messages" class="nexchat-messages">
            <?php if ($hasMoreHistory): ?>
                <button type="button" id="nexchat-load-history" class="nexchat-load-history">Carregar mensagens anteriores</button>
            <?php endif; ?>

            <?php if (empty($messages)): ?>
                <p class="nexchat-empty-chat">Nenhuma mensagem ainda. Seja o primeiro a escrever.</p>
            <?php else: ?>
                <?php foreach ($messages as $message): ?>
                    <?= $this->render('_message', ['message' => $message, 'canModerate' => $canModerate]) ?>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>

        <?php if ($conversation->type === Conversation::TYPE_CHANNEL): ?>
            <aside class="nexchat-members-panel">
                <div class="nexchat-members-title">Membros</div>
                <ul class="nexchat-members-list" id="nexchat-members-list">
                    <?php foreach ($memberships as $membership): ?>
                        <?php $memberAvatar = \humhub\modules\nexchat\models\Message::resolveAvatarUrl($membership->user ?? null); ?>
                        <li data-user-id="<?= (int) $membership->user_id ?>">
                            <span class="nexchat-member-avatar">
                                <?php if ($memberAvatar !== ''): ?>
                                    <img src="<?= Html::encode($memberAvatar) ?>" alt="" loading="lazy">
                                <?php else: ?>
                                    <span class="nexchat-avatar-fallback"><?= Html::encode(mb_strtoupper(mb_substr($membership->user->displayName ?? 'U', 0, 1))) ?></span>
                                <?php endif; ?>
                            </span>
                            <span class="nexchat-member-name"><?= Html::encode($membership->user->displayName ?? 'Usuário') ?></span>
                            <?php if ($membership->role === Membership::ROLE_ADMIN): ?>
                                <span class="nexchat-role-badge">admin</span>
                            <?php endif; ?>
                            <?php if ((int) $membership->user_id !== (int) Yii::$app->user->id): ?>
                                <button
                                    type="button"
                                    class="nexchat-dm-member"
                                    data-user-id="<?= (int) $membership->user_id ?>"
                                    title="Enviar mensagem direta"
                                >&#9993;</button>
                            <?php endif; ?>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </aside>
        <?php endif; ?>
    </div>

    <footer class="nexchat-chat-footer">
        <div id="nexchat-reply-bar" class="nexchat-reply-bar" hidden>
            <span class="nexchat-reply-bar-icon">&#8617;</span>
            <span id="nexchat-reply-bar-avatar"></span>
            <span class="nexchat-reply-bar-text">Respondendo a <strong id="nexchat-reply-bar-author"></strong></span>
            <span id="nexchat-reply-bar-preview" class="nexchat-reply-bar-preview"></span>
            <button type="button" id="nexchat-reply-cancel" class="nexchat-reply-cancel" title="Cancelar resposta">&times;</button>
        </div>
        <div id="nexchat-attachment-preview" class="nexchat-attachment-preview" hidden></div>
        <form id="nexchat-send-form" class="nexchat-send-form" enctype="multipart/form-data">
            <button type="button" id="nexchat-attach-btn" class="nexchat-attach-btn" title="Anexar arquivo">&#128206;</button>
            <input id="nexchat-file-input" type="file" name="files[]" multiple hidden
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z,.mp4,.webm,.mp3,.ogg,.wav">
            <input
                id="nexchat-message-input"
                type="text"
                placeholder="Escreva uma mensagem em #<?= Html::encode($conversation->getDisplayName()) ?>..."
                maxlength="5000"
                autocomplete="off"
                autofocus
            >
            <button type="submit" class="btn btn-primary">Enviar</button>
        </form>
    </footer>
</div>

<div id="nexchat-emoji-picker" class="nexchat-emoji-picker" hidden>
    <?php foreach (['👍', '❤️', '😂', '🎉', '😮', '😢', '🔥', '💯', '👏', '🙏', '😍', '🚀'] as $emoji): ?>
        <button type="button" class="nexchat-emoji-option" data-emoji="<?= Html::encode($emoji) ?>"><?= $emoji ?></button>
    <?php endforeach; ?>
</div>

<div id="nexchat-delete-modal" class="nexchat-modal-overlay" hidden>
    <div class="nexchat-modal" role="dialog" aria-modal="true">
        <div class="nexchat-modal-header">
            <h3 class="nexchat-modal-title">Excluir mensagem</h3>
            <button type="button" class="nexchat-modal-close" id="nexchat-delete-close" title="Fechar">&times;</button>
        </div>
        <p class="nexchat-modal-subtitle">Deseja mesmo excluir essa mensagem?</p>
        <div class="nexchat-modal-preview">
            <div class="nexchat-avatar" id="nexchat-delete-avatar"></div>
            <div class="nexchat-modal-preview-body">
                <div class="nexchat-modal-preview-meta">
                    <span class="nexchat-message-author" id="nexchat-delete-author"></span>
                    <span class="nexchat-message-time" id="nexchat-delete-time"></span>
                </div>
                <div class="nexchat-modal-preview-content" id="nexchat-delete-content"></div>
            </div>
        </div>
        <p class="nexchat-modal-tip">
            <strong class="nexchat-tip-label">FICA A DICA:</strong> você pode segurar <strong>Shift</strong> ao clicar em excluir para pular esta confirmação.
        </p>
        <div class="nexchat-modal-actions">
            <button type="button" class="nexchat-btn-cancel" id="nexchat-delete-cancel">Cancelar</button>
            <button type="button" class="nexchat-btn-danger" id="nexchat-delete-confirm">Excluir</button>
        </div>
    </div>
</div>

<?php if ($canModerate): ?>
<div id="nexchat-invite-modal" class="nexchat-modal-overlay" hidden>
    <div class="nexchat-modal" role="dialog" aria-modal="true">
        <div class="nexchat-modal-header">
            <h3 class="nexchat-modal-title">Convidar pessoas</h3>
            <button type="button" class="nexchat-modal-close" id="nexchat-invite-close" title="Fechar">&times;</button>
        </div>
        <p class="nexchat-modal-subtitle">Adicione membros ao canal <strong>#<?= Html::encode($conversation->getDisplayName()) ?></strong>.</p>
        <?php if (!empty($invitableUsers)): ?>
            <form id="nexchat-invite-form" class="nexchat-invite-form">
                <select id="nexchat-invite-user" class="nexchat-modal-select" required>
                    <option value="">Selecione um usuário...</option>
                    <?php foreach ($invitableUsers as $user): ?>
                        <option value="<?= (int) $user->id ?>"><?= Html::encode($user->displayName) ?></option>
                    <?php endforeach; ?>
                </select>
                <div class="nexchat-modal-actions">
                    <button type="button" class="nexchat-btn-cancel" id="nexchat-invite-cancel">Cancelar</button>
                    <button type="submit" class="nexchat-btn-primary">Convidar</button>
                </div>
            </form>
        <?php else: ?>
            <p class="nexchat-modal-empty">Todos os usuários já participam deste canal.</p>
            <div class="nexchat-modal-actions">
                <button type="button" class="nexchat-btn-cancel" id="nexchat-invite-cancel">Fechar</button>
            </div>
        <?php endif; ?>
    </div>
</div>

<div id="nexchat-settings-modal" class="nexchat-modal-overlay" hidden>
    <div class="nexchat-modal nexchat-modal-lg" role="dialog" aria-modal="true">
        <div class="nexchat-modal-header">
            <h3 class="nexchat-modal-title">Configurações do canal</h3>
            <button type="button" class="nexchat-modal-close" id="nexchat-settings-close" title="Fechar">&times;</button>
        </div>

        <div class="nexchat-settings-section">
            <label class="nexchat-settings-label" for="nexchat-rename-input">Nome do canal</label>
            <form id="nexchat-rename-form" class="nexchat-rename-form">
                <span class="nexchat-rename-hash">#</span>
                <input
                    id="nexchat-rename-input"
                    type="text"
                    class="nexchat-modal-input"
                    value="<?= Html::encode($conversation->name) ?>"
                    maxlength="100"
                    required
                >
                <button type="submit" class="nexchat-btn-primary">Salvar</button>
            </form>
        </div>

        <div class="nexchat-settings-section">
            <label class="nexchat-settings-label">Membros (<?= count($memberships) ?>)</label>
            <ul class="nexchat-settings-members">
                <?php foreach ($memberships as $membership): ?>
                    <?php $mAvatar = \humhub\modules\nexchat\models\Message::resolveAvatarUrl($membership->user ?? null); ?>
                    <li>
                        <span class="nexchat-member-avatar">
                            <?php if ($mAvatar !== ''): ?>
                                <img src="<?= Html::encode($mAvatar) ?>" alt="" loading="lazy">
                            <?php else: ?>
                                <span class="nexchat-avatar-fallback"><?= Html::encode(mb_strtoupper(mb_substr($membership->user->displayName ?? 'U', 0, 1))) ?></span>
                            <?php endif; ?>
                        </span>
                        <span class="nexchat-member-name"><?= Html::encode($membership->user->displayName ?? 'Usuário') ?></span>
                        <?php if ($membership->role === Membership::ROLE_ADMIN): ?>
                            <span class="nexchat-role-badge">admin</span>
                        <?php endif; ?>
                        <?php if ((int) $membership->user_id !== (int) Yii::$app->user->id): ?>
                            <button
                                type="button"
                                class="nexchat-remove-member"
                                data-user-id="<?= (int) $membership->user_id ?>"
                                title="Remover membro"
                            >&times;</button>
                        <?php endif; ?>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>

        <div class="nexchat-settings-section nexchat-danger-zone">
            <label class="nexchat-settings-label">Zona de perigo</label>
            <p class="nexchat-danger-text">Excluir o canal remove permanentemente todas as mensagens e anexos. Esta ação não pode ser desfeita.</p>
            <button type="button" class="nexchat-btn-danger" id="nexchat-delete-channel" data-armed="0">Excluir canal</button>
        </div>
    </div>
</div>
<?php endif; ?>
<?php $this->endContent(); ?>
