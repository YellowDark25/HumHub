<?php

use humhub\components\Migration;

class m260821_165000_server_notification extends Migration
{
    public function safeUp()
    {
        $this->createTable('nexchat_server_notification', [
            'id' => $this->primaryKey(),
            'user_id' => $this->integer()->notNull(),
            'space_id' => $this->integer()->notNull()->defaultValue(0),
            'level' => $this->string(16)->notNull()->defaultValue('mentions'),
            'muted_until' => $this->dateTime()->null(),
            'updated_at' => $this->dateTime()->null(),
        ]);
        $this->createIndex(
            'uk_nexchat_server_notification_user_space',
            'nexchat_server_notification',
            ['user_id', 'space_id'],
            true,
        );
    }

    public function safeDown()
    {
        $this->dropTable('nexchat_server_notification');
    }
}
