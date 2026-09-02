<?php

use humhub\components\Migration;

class m260901_114400_space_event extends Migration
{
    public function safeUp()
    {
        $this->createTable('nexchat_space_event', [
            'id' => $this->primaryKey(),
            'space_id' => $this->integer()->notNull(),
            'created_by' => $this->integer()->notNull(),
            'title' => $this->string(160)->notNull(),
            'description' => $this->text()->null(),
            'location_kind' => $this->string(16)->notNull()->defaultValue('voice'),
            'conversation_id' => $this->integer()->null(),
            'location_text' => $this->string(255)->null(),
            'starts_at' => $this->dateTime()->notNull(),
            'frequency' => $this->string(16)->notNull()->defaultValue('none'),
            'image_name' => $this->string(255)->null(),
            'image_mime' => $this->string(80)->null(),
            'created_at' => $this->dateTime()->null(),
            'updated_at' => $this->dateTime()->null(),
        ]);
        $this->createIndex(
            'idx_nexchat_space_event_space_starts',
            'nexchat_space_event',
            ['space_id', 'starts_at'],
        );
    }

    public function safeDown()
    {
        $this->dropTable('nexchat_space_event');
    }
}
