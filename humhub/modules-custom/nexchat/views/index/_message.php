<?php

use humhub\modules\nexchat\models\Attachment;
use humhub\modules\nexchat\models\Message;
use humhub\modules\nexchat\models\Reaction;
use yii\helpers\Html;

/* @var $this \humhub\components\View */
/* @var $message Message|array */
$isArray = is_array($message);
$id = $isArray ? (int) $message['id'] : (int) $message->id;
$authorName = $isArray ? ($message['authorName'] ?? 'Usuário') : ($message->author->displayName ?? 'Usuário');
$createdAt = $isArray ? ($message['createdAt'] ?? '') : ($message->created_at ?? '');
$content = $isArray ? ($message['content'] ?? '') : ($message->content ?? '');
$userId = $isArray ? (int) ($message['userId'] ?? 0) : (int) $message->user_id;
$avatarUrl = $isArray
    ? ($message['avatarUrl'] ?? '')
    : Message::resolveAvatarUrl($message->author ?? null);

$currentUserId = (int) Yii::$app->user->id;
$isOwn = $userId === $currentUserId;
$initial = mb_strtoupper(mb_substr($authorName, 0, 1));
$canModerate = $canModerate ?? false;
$isDeleted = $isArray ? !empty($message['deleted']) : $message->isDeleted();

if ($isArray) {
    $createdAtTs = (int) ($message['createdAtTs'] ?? 0);
    $editedAt = $message['editedAt'] ?? null;
} else {
    $createdAtTs = $message->created_at ? strtotime($message->created_at) : 0;
    $editedAt = $message->edited_at ?? null;
}

$canEdit = $isOwn && $createdAtTs > 0 && (time() - $createdAtTs) <= Message::EDIT_WINDOW_SECONDS;
$canDelete = $isOwn || $canModerate;

if ($isArray) {
    $attachments = $message['attachments'] ?? [];
    $reactions = $message['reactions'] ?? [];
    $replyTo = $message['replyTo'] ?? null;
} else {
    $attachments = array_map(static fn(Attachment $a) => $a->toPayload(), $message->attachments);
    $reactions = Reaction::aggregate($message->reactions, $currentUserId);
    $replyTo = ($message->reply_to_id && $message->replyTo) ? [
        'id' => (int) $message->replyTo->id,
        'authorName' => $message->replyTo->author->displayName ?? 'Usuário',
        'avatarUrl' => Message::resolveAvatarUrl($message->replyTo->author ?? null),
        'preview' => $message->replyTo->getPreview(),
    ] : null;
}
?>
<div class="nexchat-message<?= $isOwn ? ' nexchat-message-own' : '' ?><?= $isDeleted ? ' nexchat-message-deleted' : '' ?>" data-message-id="<?= $id ?>" data-content="<?= $isDeleted ? '' : Html::encode($content) ?>">
    <div class="nexchat-avatar">
        <?php if ($avatarUrl !== ''): ?>
            <img src="<?= Html::encode($avatarUrl) ?>" alt="<?= Html::encode($authorName) ?>" loading="lazy">
        <?php else: ?>
            <span class="nexchat-avatar-fallback"><?= Html::encode($initial) ?></span>
        <?php endif; ?>
    </div>
    <div class="nexchat-message-body">
        <?php if (!$isDeleted && $replyTo): ?>
            <a class="nexchat-reply-quote" href="#" data-reply-target="<?= (int) $replyTo['id'] ?>">
                <span class="nexchat-reply-icon">&#8627;</span>
                <span class="nexchat-reply-avatar">
                    <?php if (!empty($replyTo['avatarUrl'])): ?>
                        <img src="<?= Html::encode($replyTo['avatarUrl']) ?>" alt="" loading="lazy">
                    <?php else: ?>
                        <span class="nexchat-avatar-fallback"><?= Html::encode(mb_strtoupper(mb_substr($replyTo['authorName'], 0, 1))) ?></span>
                    <?php endif; ?>
                </span>
                <span class="nexchat-reply-author"><?= Html::encode($replyTo['authorName']) ?></span>
                <span class="nexchat-reply-preview"><?= Html::encode($replyTo['preview']) ?></span>
            </a>
        <?php endif; ?>
        <div class="nexchat-message-meta">
            <span class="nexchat-message-author"><?= Html::encode($authorName) ?></span>
            <span class="nexchat-message-time"><?= Html::encode($createdAt) ?></span>
            <span class="nexchat-message-edited"<?= (!$isDeleted && $editedAt) ? '' : ' hidden' ?>>(editado)</span>
        </div>
        <?php if ($isDeleted): ?>
            <div class="nexchat-message-content nexchat-deleted-text"><span class="nexchat-deleted-icon">&#128465;</span> Mensagem excluída</div>
        <?php else: ?>
        <?php if (trim((string) $content) !== ''): ?>
            <div class="nexchat-message-content"><?= nl2br(Html::encode($content)) ?></div>
        <?php endif; ?>

        <?php if (!empty($attachments)): ?>
            <div class="nexchat-attachments">
                <?php foreach ($attachments as $attachment): ?>
                    <?php if (!empty($attachment['isImage'])): ?>
                        <a class="nexchat-attachment-image" href="<?= Html::encode($attachment['url']) ?>" target="_blank" rel="noopener">
                            <img src="<?= Html::encode($attachment['url']) ?>" alt="<?= Html::encode($attachment['name']) ?>" loading="lazy">
                        </a>
                    <?php else: ?>
                        <a class="nexchat-attachment-file" href="<?= Html::encode($attachment['url']) ?>" target="_blank" rel="noopener" download>
                            <span class="nexchat-attachment-icon">&#128206;</span>
                            <span class="nexchat-attachment-info">
                                <span class="nexchat-attachment-name"><?= Html::encode($attachment['name']) ?></span>
                                <span class="nexchat-attachment-size"><?= Html::encode(Yii::$app->formatter->asShortSize((int) ($attachment['size'] ?? 0), 1)) ?></span>
                            </span>
                        </a>
                    <?php endif; ?>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <div class="nexchat-reactions" data-message-id="<?= $id ?>">
            <?php foreach ($reactions as $reaction): ?>
                <button
                    type="button"
                    class="nexchat-reaction-pill<?= !empty($reaction['mine']) ? ' mine' : '' ?>"
                    data-emoji="<?= Html::encode($reaction['emoji']) ?>"
                    title="<?= Html::encode(implode(', ', $reaction['users'] ?? [])) ?>"
                >
                    <span class="nexchat-reaction-emoji"><?= Html::encode($reaction['emoji']) ?></span>
                    <span class="nexchat-reaction-count"><?= (int) $reaction['count'] ?></span>
                </button>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
    </div>
<?php
$iconReact = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>';
$iconReply = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>';
$iconEdit = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>';
$iconTrash = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
?>
    <?php if (!$isDeleted && ($canEdit || $canDelete)): ?>
        <div class="nexchat-message-actions">
            <button type="button" class="nexchat-action-react" title="Adicionar reação"><?= $iconReact ?></button>
            <button type="button" class="nexchat-action-reply" title="Responder"><?= $iconReply ?></button>
            <?php if ($canEdit): ?>
                <button type="button" class="nexchat-action-edit" title="Editar"><?= $iconEdit ?></button>
            <?php endif; ?>
            <?php if ($canDelete): ?>
                <button type="button" class="nexchat-action-delete" title="Excluir"><?= $iconTrash ?></button>
            <?php endif; ?>
        </div>
    <?php elseif (!$isDeleted): ?>
        <div class="nexchat-message-actions">
            <button type="button" class="nexchat-action-react" title="Adicionar reação"><?= $iconReact ?></button>
            <button type="button" class="nexchat-action-reply" title="Responder"><?= $iconReply ?></button>
        </div>
    <?php endif; ?>
</div>
