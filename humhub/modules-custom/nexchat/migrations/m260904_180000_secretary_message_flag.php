<?php

use humhub\components\Migration;

class m260904_180000_secretary_message_flag extends Migration
{
    /**
     * Libera o tipo secretary na conversa e a flag is_secretary na mensagem.
     */
    public function safeUp()
    {
        $this->alterColumn('nexchat_conversation', 'type', "ENUM('dm','channel','secretary') NOT NULL");

        $table = $this->db->getTableSchema('nexchat_message', true);
        if ($table === null || $table->getColumn('is_secretary') !== null) {
            return;
        }

        $this->addColumn('nexchat_message', 'is_secretary', $this->tinyInteger(1)->notNull()->defaultValue(0));
    }

    /**
     * Remove a flag da secretária.
     */
    public function safeDown()
    {
        $table = $this->db->getTableSchema('nexchat_message', true);
        if ($table === null || $table->getColumn('is_secretary') === null) {
            return;
        }

        $this->dropColumn('nexchat_message', 'is_secretary');
    }
}
