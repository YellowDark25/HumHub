<?php

use humhub\components\Migration;

class m260824_153500_conversation_parent extends Migration
{
    public function safeUp()
    {
        $this->addColumn(
            'nexchat_conversation',
            'parent_id',
            $this->integer()->null()->after('space_id'),
        );
        $this->createIndex(
            'idx-nexchat_conversation-parent',
            'nexchat_conversation',
            'parent_id',
        );
    }

    public function safeDown()
    {
        $this->dropIndex('idx-nexchat_conversation-parent', 'nexchat_conversation');
        $this->dropColumn('nexchat_conversation', 'parent_id');
    }
}
