<?php

use humhub\components\Migration;

class m260821_083200_channel_settings extends Migration
{
    public function safeUp()
    {
        $this->addColumn('nexchat_conversation', 'topic', $this->string(1024)->null()->after('is_private'));
        $this->addColumn('nexchat_conversation', 'slow_mode_seconds', $this->integer()->notNull()->defaultValue(0)->after('topic'));
    }

    public function safeDown()
    {
        $this->dropColumn('nexchat_conversation', 'slow_mode_seconds');
        $this->dropColumn('nexchat_conversation', 'topic');
    }
}
