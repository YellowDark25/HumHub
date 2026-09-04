<?php

namespace humhub\modules\nexchat\models;

use humhub\components\ActiveRecord;
use Yii;

/**
 * Vínculo OAuth do usuário com o Google (Calendar e Tasks).
 * Guarda o refresh token; a agenda em si fica no Google, não nesta tabela.
 *
 * @property int $id
 * @property int $user_id
 * @property string $email
 * @property string $refresh_token
 * @property string|null $expires_at
 * @property string|null $created_at
 * @property string|null $updated_at
 */
class GoogleAccount extends ActiveRecord
{
    public static function tableName()
    {
        return 'nexchat_google_account';
    }

    public function rules()
    {
        return [
            [['user_id', 'email', 'refresh_token'], 'required'],
            [['user_id'], 'integer'],
            [['email'], 'string', 'max' => 255],
            [['refresh_token'], 'string'],
            [['expires_at', 'created_at', 'updated_at'], 'safe'],
        ];
    }

    /**
     * Status visível para o dono da conta (sem o refresh token).
     *
     * @return array{connected: bool, email: string}
     */
    public function toStatusPayload(): array
    {
        return [
            'connected' => true,
            'email' => (string) $this->email,
        ];
    }

    /**
     * Payload interno do serviço da secretária (inclui o refresh token).
     *
     * @return array{userId: int, email: string, refreshToken: string, expiresAt: string|null}
     */
    public function toServicePayload(): array
    {
        return [
            'userId' => (int) $this->user_id,
            'email' => (string) $this->email,
            'refreshToken' => (string) $this->refresh_token,
            'expiresAt' => $this->expires_at,
        ];
    }

    /**
     * Diz se a tabela do vínculo Google já existe.
     */
    public static function tableExists(): bool
    {
        return Yii::$app->db->getTableSchema(self::tableName(), true) !== null;
    }

    /**
     * Garante a tabela do vínculo Google.
     * Se a migration ainda não rodou, cria nexchat_google_account na hora.
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
                email VARCHAR(255) NOT NULL,
                refresh_token TEXT NOT NULL,
                expires_at DATETIME NULL,
                created_at DATETIME NULL,
                updated_at DATETIME NULL,
                PRIMARY KEY (id),
                UNIQUE INDEX idx_nexchat_google_account_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        )->execute();
        $db->getSchema()->refreshTableSchema(self::tableName());

        return self::tableExists();
    }

    /**
     * Cria ou atualiza o vínculo do usuário.
     */
    public static function upsert(int $userId, string $email, string $refreshToken, ?string $expiresAt): self
    {
        self::ensureTable();
        $account = self::findOne(['user_id' => $userId]) ?? new self();
        $account->user_id = $userId;
        $account->email = $email;
        $account->refresh_token = $refreshToken;
        $account->expires_at = $expiresAt;
        $now = date('Y-m-d H:i:s');
        if ($account->isNewRecord) {
            $account->created_at = $now;
        }
        $account->updated_at = $now;
        $account->save(false);

        return $account;
    }
}
