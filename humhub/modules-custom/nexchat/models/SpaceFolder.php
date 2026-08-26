<?php

namespace humhub\modules\nexchat\models;

use humhub\components\ActiveRecord;

/**
 * Pasta do drive de um espaço.
 *
 * @property int $id
 * @property int $space_id
 * @property int|null $parent_id
 * @property string $name
 * @property int|null $created_by
 * @property string|null $created_at
 */
class SpaceFolder extends ActiveRecord
{
    public const NAME_MAX = 80;
    public const DEPTH_MAX = 8;

    public static function tableName()
    {
        return 'nexchat_space_folder';
    }

    public function rules()
    {
        return [
            [['space_id', 'name'], 'required'],
            [['space_id', 'parent_id', 'created_by'], 'integer'],
            [['name'], 'string', 'max' => self::NAME_MAX],
            [['created_at'], 'safe'],
        ];
    }

    public function getParent()
    {
        return $this->hasOne(self::class, ['id' => 'parent_id']);
    }

    public function getChildren()
    {
        return $this->hasMany(self::class, ['parent_id' => 'id']);
    }

    public function getFiles()
    {
        return $this->hasMany(SpaceDriveFile::class, ['folder_id' => 'id']);
    }
}
