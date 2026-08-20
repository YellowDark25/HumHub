<?php

use humhub\components\Migration;

class m260626_173000_message_soft_delete extends Migration
{
    public function safeUp()
    {
        $this->addColumn('nexchat_message', 'deleted_at', $this->dateTime()->null()->after('edited_at'));
        $this->addColumn('nexchat_message', 'deleted_by', $this->integer()->null()->after('deleted_at'));
    }

    public function safeDown()
    {
        $this->dropColumn('nexchat_message', 'deleted_by');
        $this->dropColumn('nexchat_message', 'deleted_at');
    }
}
