<?php

namespace humhub\modules\nexchat\models;

use humhub\components\ActiveRecord;
use Yii;

/**
 * Preferência estruturada do usuário gravada pela secretária.
 * Uma linha por chave (ex. duracao_reuniao); o modelo decide quando escrever via tool.
 *
 * @property int $id
 * @property int $user_id
 * @property string $memory_key
 * @property string $memory_value
 * @property string|null $created_at
 * @property string|null $updated_at
 */
class SecretaryUserMemory extends ActiveRecord
{
    public const KEY_MAX_LENGTH = 64;
    public const VALUE_MAX_LENGTH = 500;
    public const LIST_LIMIT = 50;

    /**
     * Nome da tabela de preferências do usuário.
     */
    public static function tableName()
    {
        return 'nexchat_secretary_user_memory';
    }

    /**
     * Regras de validação da preferência.
     */
    public function rules()
    {
        return [
            [['user_id', 'memory_key', 'memory_value'], 'required'],
            [['user_id'], 'integer'],
            [['memory_key'], 'string', 'max' => self::KEY_MAX_LENGTH],
            [['memory_value'], 'string', 'max' => self::VALUE_MAX_LENGTH],
            [['created_at', 'updated_at'], 'safe'],
        ];
    }

    /**
     * Diz se a tabela de preferências já existe.
     */
    public static function tableExists(): bool
    {
        return Yii::$app->db->getTableSchema(self::tableName(), true) !== null;
    }

    /**
     * Garante a tabela de preferências.
     * Se a migration ainda não rodou, cria nexchat_secretary_user_memory na hora.
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
                user_id INT NOT NULL,
                memory_key VARCHAR(64) NOT NULL,
                memory_value TEXT NOT NULL,
                created_at DATETIME NULL,
                updated_at DATETIME NULL,
                PRIMARY KEY (id),
                UNIQUE INDEX idx_nexchat_secretary_memory_user_key (user_id, memory_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        )->execute();
        $db->getSchema()->refreshTableSchema(self::tableName());

        return self::tableExists();
    }

    /**
     * Normaliza a chave para slug minúsculo com underscore.
     */
    public static function normalizeKey(string $key): string
    {
        $normalized = strtolower(trim($key));
        $normalized = preg_replace('/[^a-z0-9_]+/', '_', $normalized) ?? '';
        $normalized = trim($normalized, '_');

        return substr($normalized, 0, self::KEY_MAX_LENGTH);
    }

    /**
     * Lista as preferências mais recentes do usuário, da mais nova para a mais antiga.
     *
     * @return array<int, array{key: string, value: string}>
     */
    public static function listForUser(int $userId): array
    {
        self::ensureTable();
        $rows = self::find()
            ->where(['user_id' => $userId])
            ->orderBy(['updated_at' => SORT_DESC, 'id' => SORT_DESC])
            ->limit(self::LIST_LIMIT)
            ->all();

        return array_map(static fn(self $row) => [
            'key' => (string) $row->memory_key,
            'value' => (string) $row->memory_value,
        ], $rows);
    }

    /**
     * Cria ou atualiza uma preferência.
     *
     * @return array{key: string, value: string}
     */
    public static function remember(int $userId, string $key, string $value): array
    {
        self::ensureTable();
        $row = self::findOne(['user_id' => $userId, 'memory_key' => $key]) ?? new self();
        $row->user_id = $userId;
        $row->memory_key = $key;
        $row->memory_value = $value;
        $now = date('Y-m-d H:i:s');
        if ($row->isNewRecord) {
            $row->created_at = $now;
        }
        $row->updated_at = $now;
        $row->save(false);

        return [
            'key' => (string) $row->memory_key,
            'value' => (string) $row->memory_value,
        ];
    }

    /**
     * Apaga a preferência daquela chave. Devolve false se ela não existia.
     */
    public static function forget(int $userId, string $key): bool
    {
        self::ensureTable();
        $row = self::findOne(['user_id' => $userId, 'memory_key' => $key]);
        if (!$row) {
            return false;
        }

        $row->delete();

        return true;
    }
}
