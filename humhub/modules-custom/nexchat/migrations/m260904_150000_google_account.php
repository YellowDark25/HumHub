<?php

use humhub\components\Migration;

class m260904_150000_google_account extends Migration
{
    /**
     * Cria a tabela do vínculo Google (OAuth) por usuário.
     * Só credencial; Calendar e Tasks continuam no Google.
     */
    public function safeUp()
    {
        $this->createTable('nexchat_google_account', [
            'id' => $this->primaryKey(),
            'user_id' => $this->integer()->notNull(),
            'email' => $this->string(255)->notNull(),
            'refresh_token' => $this->text()->notNull(),
            'expires_at' => $this->dateTime()->null(),
            'created_at' => $this->dateTime()->null(),
            'updated_at' => $this->dateTime()->null(),
        ]);
        $this->createIndex(
            'idx_nexchat_google_account_user',
            'nexchat_google_account',
            'user_id',
            true,
        );
    }

    /**
     * Remove a tabela do vínculo Google.
     */
    public function safeDown()
    {
        $this->dropTable('nexchat_google_account');
    }
}
