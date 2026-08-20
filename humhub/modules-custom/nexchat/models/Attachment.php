<?php

namespace humhub\modules\nexchat\models;

use humhub\components\ActiveRecord;
use humhub\modules\nexchat\Module;
use Yii;
use yii\helpers\Url;

/**
 * @property int $id
 * @property int $message_id
 * @property string $file_name
 * @property string $stored_name
 * @property string|null $mime
 * @property int|null $size
 * @property bool $is_image
 * @property string|null $created_at
 *
 * @property-read Message $message
 */
class Attachment extends ActiveRecord
{
    public static function tableName()
    {
        return 'nexchat_attachment';
    }

    public function rules()
    {
        return [
            [['message_id', 'file_name', 'stored_name'], 'required'],
            [['message_id', 'size'], 'integer'],
            [['is_image'], 'boolean'],
            [['file_name'], 'string', 'max' => 255],
            [['stored_name'], 'string', 'max' => 120],
            [['mime'], 'string', 'max' => 150],
            [['created_at'], 'safe'],
        ];
    }

    public function getMessage()
    {
        return $this->hasOne(Message::class, ['id' => 'message_id']);
    }

    public function getFilePath(): string
    {
        return Module::uploadBasePath() . DIRECTORY_SEPARATOR . $this->stored_name;
    }

    public function getUrl(): string
    {
        return Url::to(['/nexchat/index/file', 'id' => (int) $this->id]);
    }

    public function toPayload(): array
    {
        return [
            'id' => (int) $this->id,
            'name' => $this->file_name,
            'url' => $this->getUrl(),
            'mime' => $this->mime,
            'size' => (int) $this->size,
            'isImage' => (bool) $this->is_image,
        ];
    }

    public static function isImageMime(?string $mime): bool
    {
        return $mime !== null && str_starts_with($mime, 'image/');
    }

    public function afterDelete()
    {
        parent::afterDelete();

        $path = $this->getFilePath();
        if (is_file($path)) {
            @unlink($path);
        }
    }
}
