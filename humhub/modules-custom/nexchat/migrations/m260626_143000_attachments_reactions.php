<?php

use humhub\components\Migration;

class m260626_143000_attachments_reactions extends Migration
{
    public function safeUp()
    {
        $this->safeCreateTable('nexchat_attachment', [
            'id' => $this->primaryKey(),
            'message_id' => $this->integer()->notNull(),
            'file_name' => $this->string(255)->notNull(),
            'stored_name' => $this->string(120)->notNull(),
            'mime' => $this->string(150)->null(),
            'size' => $this->bigInteger()->null(),
            'is_image' => $this->boolean()->notNull()->defaultValue(false),
            'created_at' => $this->dateTime()->null(),
        ], '');

        $this->safeCreateIndex('idx-nexchat_attachment-message', 'nexchat_attachment', 'message_id');

        $this->safeAddForeignKey(
            'fk-nexchat_attachment-message',
            'nexchat_attachment',
            'message_id',
            'nexchat_message',
            'id',
            'CASCADE',
            'CASCADE',
        );

        $this->safeCreateTable('nexchat_reaction', [
            'id' => $this->primaryKey(),
            'message_id' => $this->integer()->notNull(),
            'user_id' => $this->integer()->notNull(),
            'emoji' => $this->string(32)->notNull(),
            'created_at' => $this->dateTime()->null(),
        ], '');

        $this->safeCreateIndex('idx-nexchat_reaction-unique', 'nexchat_reaction', ['message_id', 'user_id', 'emoji'], true);
        $this->safeCreateIndex('idx-nexchat_reaction-message', 'nexchat_reaction', 'message_id');

        $this->safeAddForeignKey(
            'fk-nexchat_reaction-message',
            'nexchat_reaction',
            'message_id',
            'nexchat_message',
            'id',
            'CASCADE',
            'CASCADE',
        );

        $this->safeAddForeignKey(
            'fk-nexchat_reaction-user',
            'nexchat_reaction',
            'user_id',
            'user',
            'id',
            'CASCADE',
            'CASCADE',
        );

        $this->execute("ALTER TABLE nexchat_message MODIFY content TEXT NULL");
    }

    public function safeDown()
    {
        $this->dropForeignKey('fk-nexchat_reaction-user', 'nexchat_reaction');
        $this->dropForeignKey('fk-nexchat_reaction-message', 'nexchat_reaction');
        $this->dropForeignKey('fk-nexchat_attachment-message', 'nexchat_attachment');
        $this->dropTable('nexchat_reaction');
        $this->dropTable('nexchat_attachment');
    }
}
