<?php

use humhub\components\Migration;
use yii\db\Query;

class m260821_131900_space_server extends Migration
{
    public function safeUp()
    {
        $this->createTable('nexchat_space_server', [
            'space_id' => $this->integer()->notNull(),
            'created_at' => $this->dateTime()->null(),
        ]);
        $this->addPrimaryKey('pk_nexchat_space_server', 'nexchat_space_server', 'space_id');

        if ($this->db->getTableSchema('space', true) === null) {
            return;
        }

        $now = date('Y-m-d H:i:s');
        $ids = (new Query())->select('id')->from('space')->column();
        foreach ($ids as $id) {
            $this->insert('nexchat_space_server', [
                'space_id' => (int) $id,
                'created_at' => $now,
            ]);
        }
    }

    public function safeDown()
    {
        $this->dropTable('nexchat_space_server');
    }
}
