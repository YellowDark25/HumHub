<?php

use humhub\components\Migration;

class m260821_082000_channel_details extends Migration
{
    public function safeUp()
    {
        $this->addColumn('nexchat_conversation', 'space_id', $this->integer()->null()->after('name'));
        $this->addColumn('nexchat_conversation', 'channel_kind', $this->string(16)->null()->after('space_id'));
        $this->addColumn('nexchat_conversation', 'is_private', $this->boolean()->notNull()->defaultValue(0)->after('channel_kind'));
        $this->update('nexchat_conversation', ['channel_kind' => 'text'], ['type' => 'channel']);
        $this->createIndex('idx_nexchat_conversation_space', 'nexchat_conversation', 'space_id');
    }

    public function safeDown()
    {
        $this->dropIndex('idx_nexchat_conversation_space', 'nexchat_conversation');
        $this->dropColumn('nexchat_conversation', 'is_private');
        $this->dropColumn('nexchat_conversation', 'channel_kind');
        $this->dropColumn('nexchat_conversation', 'space_id');
    }
}
