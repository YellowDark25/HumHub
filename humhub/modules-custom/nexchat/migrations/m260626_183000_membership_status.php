<?php

use humhub\components\Migration;

class m260626_183000_membership_status extends Migration
{
    public function safeUp()
    {
        $this->addColumn('nexchat_membership', 'status', $this->string(16)->notNull()->defaultValue('active')->after('role'));
        $this->update('nexchat_membership', ['status' => 'active']);
        $this->createIndex('idx_nexchat_membership_status', 'nexchat_membership', ['user_id', 'status']);
    }

    public function safeDown()
    {
        $this->dropIndex('idx_nexchat_membership_status', 'nexchat_membership');
        $this->dropColumn('nexchat_membership', 'status');
    }
}
