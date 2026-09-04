<?php

use humhub\components\Migration;

class m260904_210000_secretary_memory extends Migration
{
    /**
     * Cria o resumo rolante da DM e a memória de preferências da secretária.
     */
    public function safeUp()
    {
        $this->createTable('nexchat_secretary_conversation_state', [
            'id' => $this->primaryKey(),
            'conversation_id' => $this->integer()->notNull(),
            'summary' => $this->text()->notNull(),
            'summarized_up_to_message_id' => $this->integer()->notNull()->defaultValue(0),
            'turn_count' => $this->integer()->notNull()->defaultValue(0),
            'created_at' => $this->dateTime()->null(),
            'updated_at' => $this->dateTime()->null(),
        ]);
        $this->createIndex(
            'idx_nexchat_secretary_state_conversation',
            'nexchat_secretary_conversation_state',
            'conversation_id',
            true,
        );

        $this->createTable('nexchat_secretary_user_memory', [
            'id' => $this->primaryKey(),
            'user_id' => $this->integer()->notNull(),
            'memory_key' => $this->string(64)->notNull(),
            'memory_value' => $this->text()->notNull(),
            'created_at' => $this->dateTime()->null(),
            'updated_at' => $this->dateTime()->null(),
        ]);
        $this->createIndex(
            'idx_nexchat_secretary_memory_user_key',
            'nexchat_secretary_user_memory',
            ['user_id', 'memory_key'],
            true,
        );
    }

    /**
     * Remove as tabelas de memória da secretária.
     */
    public function safeDown()
    {
        $this->dropTable('nexchat_secretary_user_memory');
        $this->dropTable('nexchat_secretary_conversation_state');
    }
}
