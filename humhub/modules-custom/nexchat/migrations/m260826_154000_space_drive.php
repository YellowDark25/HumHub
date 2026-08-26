<?php

use humhub\components\Migration;

class m260826_154000_space_drive extends Migration
{
    public function safeUp()
    {
        $this->createTable('nexchat_space_folder', [
            'id' => $this->primaryKey(),
            'space_id' => $this->integer()->notNull(),
            'parent_id' => $this->integer()->null(),
            'name' => $this->string(80)->notNull(),
            'created_by' => $this->integer()->null(),
            'created_at' => $this->dateTime()->null(),
        ]);
        $this->createIndex('idx_nexchat_space_folder_parent', 'nexchat_space_folder', ['space_id', 'parent_id']);

        $this->createTable('nexchat_space_file', [
            'id' => $this->primaryKey(),
            'space_id' => $this->integer()->notNull(),
            'folder_id' => $this->integer()->null(),
            'file_name' => $this->string(255)->notNull(),
            'stored_name' => $this->string(120)->notNull(),
            'mime' => $this->string(150)->null(),
            'size' => $this->integer()->null(),
            'is_image' => $this->boolean()->notNull()->defaultValue(0),
            'description' => $this->string(500)->null(),
            'created_by' => $this->integer()->null(),
            'created_at' => $this->dateTime()->null(),
        ]);
        $this->createIndex('idx_nexchat_space_file_folder', 'nexchat_space_file', ['space_id', 'folder_id']);
    }

    public function safeDown()
    {
        $this->dropTable('nexchat_space_file');
        $this->dropTable('nexchat_space_folder');
    }
}
