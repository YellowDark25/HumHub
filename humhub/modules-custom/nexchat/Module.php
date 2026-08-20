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
            \humhub\modules\nexchat\notifications\ChannelInvite::class,
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
        $path = '/data/nexchat-uploads';

        if (!is_dir($path)) {
            @mkdir($path, 0775, true);
        }

        return $path;
    }
}
