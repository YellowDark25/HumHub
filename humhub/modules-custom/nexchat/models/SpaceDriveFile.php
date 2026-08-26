<?php

namespace humhub\modules\nexchat\models;

use humhub\components\ActiveRecord;
use humhub\modules\nexchat\Module;

/**
 * Arquivo gravado no drive de um espaço.
 *
 * @property int $id
 * @property int $space_id
 * @property int|null $folder_id
 * @property string $file_name
 * @property string $stored_name
 * @property string|null $mime
 * @property int|null $size
 * @property bool $is_image
 * @property string|null $description
 * @property int|null $created_by
 * @property string|null $created_at
 */
class SpaceDriveFile extends ActiveRecord
{
    public static function tableName()
    {
        return 'nexchat_space_file';
    }

    public function rules()
    {
        return [
            [['space_id', 'file_name', 'stored_name'], 'required'],
            [['space_id', 'folder_id', 'size', 'created_by'], 'integer'],
            [['is_image'], 'boolean'],
            [['file_name'], 'string', 'max' => 255],
            [['stored_name'], 'string', 'max' => 120],
            [['mime'], 'string', 'max' => 150],
            [['description'], 'string', 'max' => 500],
            [['created_at'], 'safe'],
        ];
    }

    public function getFolder()
    {
        return $this->hasOne(SpaceFolder::class, ['id' => 'folder_id']);
    }

    public function getFilePath(): string
    {
        return Module::uploadBasePath() . DIRECTORY_SEPARATOR . $this->stored_name;
    }

    public function isAudio(): bool
    {
        return str_starts_with((string) $this->mime, 'audio/');
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
