<?php

use humhub\components\Migration;

class m260626_163000_message_edited extends Migration
{
    public function safeUp()
    {
        $this->addColumn('nexchat_message', 'edited_at', $this->dateTime()->null()->after('content'));
    }

    public function safeDown()
    {
        $this->dropColumn('nexchat_message', 'edited_at');
    }
}
