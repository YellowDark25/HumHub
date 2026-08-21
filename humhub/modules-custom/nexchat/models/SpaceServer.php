<?php

namespace humhub\modules\nexchat\models;

use humhub\components\ActiveRecord;

/**
 * @property int $space_id
 * @property string|null $created_at
 */
class SpaceServer extends ActiveRecord
{
    public static function tableName()
    {
        return 'nexchat_space_server';
    }

    /**
     * @return int[]
     */
    public static function spaceIds(): array
    {
        return array_map(
            static fn($id) => (int) $id,
            static::find()->select('space_id')->column(),
        );
    }

    public static function enable(int $spaceId): void
    {
        if (static::findOne(['space_id' => $spaceId])) {
            return;
        }

        $row = new static();
        $row->space_id = $spaceId;
        $row->created_at = date('Y-m-d H:i:s');
        $row->save(false);
    }
}
