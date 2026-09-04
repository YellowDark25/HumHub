<?php

namespace humhub\modules\nexchat\models;

use humhub\components\ActiveRecord;
use Yii;

/**
 * Resumo rolante da DM da secretária.
 * Guarda o texto compacto e até qual mensagem ele já cobriu, para o próximo turno
 * mandar resumo + só as falas recentes cruas.
 *
 * @property int $id
 * @property int $conversation_id
 * @property string $summary
 * @property int $summarized_up_to_message_id
 * @property int $turn_count
 * @property string|null $created_at
 * @property string|null $updated_at
 */
class SecretaryConversationState extends ActiveRecord
{
    /**
     * Nome da tabela do resumo rolante.
     */
    public static function tableName()
    {
        return 'nexchat_secretary_conversation_state';
    }

    /**
     * Regras de validação do estado da conversa.
     */
    public function rules()
    {
        return [
            [['conversation_id'], 'required'],
            [['conversation_id', 'summarized_up_to_message_id', 'turn_count'], 'integer'],
            [['summary'], 'string'],
            [['created_at', 'updated_at'], 'safe'],
        ];
    }

    /**
     * Diz se a tabela do resumo já existe.
     */
    public static function tableExists(): bool
    {
        return Yii::$app->db->getTableSchema(self::tableName(), true) !== null;
    }

    /**
     * Garante a tabela do resumo.
     * Se a migration ainda não rodou, cria nexchat_secretary_conversation_state na hora.
     */
    public static function ensureTable(): bool
    {
        if (self::tableExists()) {
            return true;
        }

        $db = Yii::$app->db;
        $table = $db->quoteTableName(self::tableName());
        $db->createCommand(
            "CREATE TABLE {$table} (
                id INT NOT NULL AUTO_INCREMENT,
                conversation_id INT NOT NULL,
                summary TEXT NOT NULL,
                summarized_up_to_message_id INT NOT NULL DEFAULT 0,
                turn_count INT NOT NULL DEFAULT 0,
                created_at DATETIME NULL,
                updated_at DATETIME NULL,
                PRIMARY KEY (id),
                UNIQUE INDEX idx_nexchat_secretary_state_conversation (conversation_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        )->execute();
        $db->getSchema()->refreshTableSchema(self::tableName());

        return self::tableExists();
    }

    /**
     * Lê o estado da conversa, ou um payload vazio quando ainda não há resumo.
     *
     * @return array{conversationId: int, summary: string, summarizedUpToMessageId: int, turnCount: int}
     */
    public static function payloadFor(int $conversationId): array
    {
        self::ensureTable();
        $row = self::findOne(['conversation_id' => $conversationId]);

        return [
            'conversationId' => $conversationId,
            'summary' => $row ? (string) $row->summary : '',
            'summarizedUpToMessageId' => $row ? (int) $row->summarized_up_to_message_id : 0,
            'turnCount' => $row ? (int) $row->turn_count : 0,
        ];
    }

    /**
     * Cria ou atualiza o resumo da conversa.
     *
     * @return array{conversationId: int, summary: string, summarizedUpToMessageId: int, turnCount: int}
     */
    public static function upsert(
        int $conversationId,
        string $summary,
        int $summarizedUpToMessageId,
        int $turnCount,
    ): array {
        self::ensureTable();
        $row = self::findOne(['conversation_id' => $conversationId]) ?? new self();
        $row->conversation_id = $conversationId;
        $row->summary = $summary;
        $row->summarized_up_to_message_id = max(0, $summarizedUpToMessageId);
        $row->turn_count = max(0, $turnCount);
        $now = date('Y-m-d H:i:s');
        if ($row->isNewRecord) {
            $row->created_at = $now;
        }
        $row->updated_at = $now;
        $row->save(false);

        return self::payloadFor($conversationId);
    }
}
