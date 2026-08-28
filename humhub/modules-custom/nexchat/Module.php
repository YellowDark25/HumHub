<?php

namespace humhub\modules\nexchat;

use Yii;

class Module extends \humhub\components\Module
{
    public function getName()
    {
        return 'Chat';
    }

    public function getDescription()
    {
        return Yii::t('NexchatModule.base', 'Chat estilo Discord: conversas individuais e canais em grupo.');
    }

    public function getNotifications()
    {
        return [
            \humhub\modules\nexchat\notifications\NewDmMessage::class,
            \humhub\modules\nexchat\notifications\NewChannelMessage::class,
            \humhub\modules\nexchat\notifications\ChannelInvite::class,
            \humhub\modules\nexchat\notifications\SpaceInviteNotification::class,
            \humhub\modules\nexchat\notifications\FriendshipRequestNotification::class,
            \humhub\modules\nexchat\notifications\FriendshipAcceptedNotification::class,
        ];
    }

    /**
     * Permissões de grupo do módulo (tela Administração → Grupos → Permissões).
     * Só no nível da instalação; não há permissão por espaço/container.
     */
    public function getPermissions($contentContainer = null)
    {
        if ($contentContainer) {
            return [];
        }

        return [
            new permissions\EditOtherUsers(),
            new permissions\ManageSpaceDrive(),
        ];
    }

    public const MAX_UPLOAD_SIZE = 26214400;

    public const ALLOWED_EXTENSIONS = [
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg',
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        'txt', 'csv', 'zip', 'rar', '7z', 'mp4', 'webm', 'mp3', 'ogg', 'wav',
    ];

    public static function uploadBasePath(): string
    {
        return self::ensureUploadPath() ?? '/data/uploads/nexchat';
    }

    public static function ensureUploadPath(): ?string
    {
        $path = '/data/uploads/nexchat';
        if (!is_dir($path) && !@mkdir($path, 0775, true) && !is_dir($path)) {
            return null;
        }

        return is_writable($path) ? $path : null;
    }
}
