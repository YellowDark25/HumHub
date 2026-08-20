<?php

use humhub\components\Migration;

class m260326_133000_initial extends Migration
{
    public function safeUp()
    {
        $this->safeCreateTable('nexchat_conversation', [
            'id' => $this->primaryKey(),
            'type' => "ENUM('dm','channel') NOT NULL",
            'name' => $this->string(100)->null(),
            'dm_key' => $this->string(50)->null(),
            'last_message_at' => $this->dateTime()->null(),
            'created_at' => $this->dateTime()->null(),
            'created_by' => $this->integer()->null(),
            'updated_at' => $this->dateTime()->null(),
            'updated_by' => $this->integer()->null(),
        ], '');

        $this->safeCreateIndex('idx-nexchat_conversation-dm_key', 'nexchat_conversation', 'dm_key', true);
        $this->safeCreateIndex('idx-nexchat_conversation-type', 'nexchat_conversation', 'type');

        $this->safeCreateTable('nexchat_membership', [
            'id' => $this->primaryKey(),
            'conversation_id' => $this->integer()->notNull(),
            'user_id' => $this->integer()->notNull(),
            'role' => "ENUM('member','admin') NOT NULL DEFAULT 'member'",
            'joined_at' => $this->dateTime()->null(),
        ], '');

        $this->safeCreateIndex('idx-nexchat_membership-unique', 'nexchat_membership', ['conversation_id', 'user_id'], true);
        $this->safeCreateIndex('idx-nexchat_membership-user', 'nexchat_membership', 'user_id');

        $this->safeCreateTable('nexchat_message', [
            'id' => $this->primaryKey(),
            'conversation_id' => $this->integer()->notNull(),
            'user_id' => $this->integer()->notNull(),
            'content' => $this->text()->notNull(),
            'created_at' => $this->dateTime()->null(),
            'created_by' => $this->integer()->null(),
            'updated_at' => $this->dateTime()->null(),
            'updated_by' => $this->integer()->null(),
        ], '');

        $this->safeCreateIndex('idx-nexchat_message-conversation', 'nexchat_message', 'conversation_id');
        $this->safeCreateIndex('idx-nexchat_message-created_at', 'nexchat_message', 'created_at');

        $this->safeAddForeignKey(
            'fk-nexchat_membership-conversation',
            'nexchat_membership',
            'conversation_id',
            'nexchat_conversation',
            'id',
            'CASCADE',
            'CASCADE',
        );

        $this->safeAddForeignKey(
            'fk-nexchat_membership-user',
            'nexchat_membership',
            'user_id',
            'user',
            'id',
            'CASCADE',
            'CASCADE',
        );

        $this->safeAddForeignKey(
            'fk-nexchat_message-conversation',
            'nexchat_message',
            'conversation_id',
            'nexchat_conversation',
            'id',
            'CASCADE',
            'CASCADE',
        );

        $this->safeAddForeignKey(
            'fk-nexchat_message-user',
            'nexchat_message',
            'user_id',
            'user',
            'id',
            'CASCADE',
            'CASCADE',
        );
    }

    public function safeDown()
    {
        $this->dropForeignKey('fk-nexchat_message-user', 'nexchat_message');
        $this->dropForeignKey('fk-nexchat_message-conversation', 'nexchat_message');
        $this->dropForeignKey('fk-nexchat_membership-user', 'nexchat_membership');
        $this->dropForeignKey('fk-nexchat_membership-conversation', 'nexchat_membership');
        $this->dropTable('nexchat_message');
        $this->dropTable('nexchat_membership');
        $this->dropTable('nexchat_conversation');
    }
}
