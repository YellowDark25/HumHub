<?php

use humhub\components\Migration;

class m260626_153000_message_reply extends Migration
{
    public function safeUp()
    {
        $this->addColumn('nexchat_message', 'reply_to_id', $this->integer()->null()->after('user_id'));
        $this->safeCreateIndex('idx-nexchat_message-reply', 'nexchat_message', 'reply_to_id');

        $this->safeAddForeignKey(
            'fk-nexchat_message-reply',
            'nexchat_message',
            'reply_to_id',
            'nexchat_message',
            'id',
            'SET NULL',
            'CASCADE',
        );
    }

    public function safeDown()
    {
        $this->dropForeignKey('fk-nexchat_message-reply', 'nexchat_message');
        $this->dropColumn('nexchat_message', 'reply_to_id');
    }
}
