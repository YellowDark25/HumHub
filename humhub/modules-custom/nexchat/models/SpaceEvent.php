<?php

namespace humhub\modules\nexchat\models;

use humhub\components\ActiveRecord;
use humhub\modules\nexchat\Module;
use humhub\modules\user\models\User;
use Yii;
use yii\web\UploadedFile;

/**
 * Evento agendado de um servidor (espaço) do chat.
 *
 * @property int $id
 * @property int $space_id
 * @property int $created_by
 * @property string $title
 * @property string|null $description
 * @property string $location_kind voice|elsewhere
 * @property int|null $conversation_id
 * @property string|null $location_text
 * @property string $starts_at
 * @property string $frequency none|weekly|monthly
 * @property string|null $image_name
 * @property string|null $image_mime
 * @property string|null $created_at
 * @property string|null $updated_at
 */
class SpaceEvent extends ActiveRecord
{
    public const KIND_VOICE = 'voice';
    public const KIND_ELSEWHERE = 'elsewhere';
    public const FREQUENCY_NONE = 'none';
    public const FREQUENCY_WEEKLY = 'weekly';
    public const FREQUENCY_MONTHLY = 'monthly';
    public const IMAGE_MAX_BYTES = 5242880;
    public const INTEREST_TABLE = 'nexchat_space_event_interest';

    public static function tableName()
    {
        return 'nexchat_space_event';
    }

    public function rules()
    {
        return [
            [['space_id', 'created_by', 'title', 'location_kind', 'starts_at', 'frequency'], 'required'],
            [['space_id', 'created_by', 'conversation_id'], 'integer'],
            [['title'], 'string', 'max' => 160],
            [['location_text', 'image_name'], 'string', 'max' => 255],
            [['image_mime'], 'string', 'max' => 80],
            [['description'], 'string'],
            [['location_kind'], 'in', 'range' => self::locationKinds()],
            [['frequency'], 'in', 'range' => self::frequencies()],
            [['starts_at', 'created_at', 'updated_at'], 'safe'],
        ];
    }

    /**
     * @return string[]
     */
    public static function locationKinds(): array
    {
        return [self::KIND_VOICE, self::KIND_ELSEWHERE];
    }

    /**
     * @return string[]
     */
    public static function frequencies(): array
    {
        return [self::FREQUENCY_NONE, self::FREQUENCY_WEEKLY, self::FREQUENCY_MONTHLY];
    }

    public static function tableExists(): bool
    {
        return Yii::$app->db->getTableSchema(self::tableName(), true) !== null;
    }

    /**
     * Garante a tabela de eventos no banco.
     * Se a migration ainda não rodou, cria nexchat_space_event na hora.
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
                space_id INT NOT NULL,
                created_by INT NOT NULL,
                title VARCHAR(160) NOT NULL,
                description TEXT NULL,
                location_kind VARCHAR(16) NOT NULL DEFAULT 'voice',
                conversation_id INT NULL,
                location_text VARCHAR(255) NULL,
                starts_at DATETIME NOT NULL,
                frequency VARCHAR(16) NOT NULL DEFAULT 'none',
                image_name VARCHAR(255) NULL,
                image_mime VARCHAR(80) NULL,
                created_at DATETIME NULL,
                updated_at DATETIME NULL,
                PRIMARY KEY (id),
                INDEX idx_nexchat_space_event_space_starts (space_id, starts_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        )->execute();

        $db->getSchema()->refreshTableSchema(self::tableName());

        return self::tableExists();
    }

    public function beforeSave($insert)
    {
        $now = date('Y-m-d H:i:s');
        if ($insert && !$this->created_at) {
            $this->created_at = $now;
        }
        $this->updated_at = $now;

        return parent::beforeSave($insert);
    }

    /**
     * Guarda a imagem de apresentação no disco do módulo.
     * Valida tipo e tamanho, grava o arquivo e atualiza image_name/image_mime.
     */
    public function storeImage(UploadedFile $file): ?string
    {
        $extension = strtolower((string) $file->extension);
        if (!in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp'], true)) {
            return 'Envie uma imagem JPG, PNG, GIF ou WebP.';
        }

        if ((int) $file->size > self::IMAGE_MAX_BYTES) {
            return 'A imagem pode ter no máximo 5 MB.';
        }

        $directory = $this->imageDirectory();
        if ($directory === null) {
            return 'Não foi possível guardar a imagem.';
        }

        $name = $this->id . '_' . bin2hex(random_bytes(6)) . '.' . $extension;
        if (!$file->saveAs($directory . '/' . $name)) {
            return 'Não foi possível guardar a imagem.';
        }

        $this->deleteImageFile();
        $this->image_name = $name;
        $this->image_mime = $file->type ?: 'image/' . $extension;
        $this->save(false, ['image_name', 'image_mime', 'updated_at']);

        return null;
    }

    public function getImagePath(): ?string
    {
        if (!$this->image_name) {
            return null;
        }

        $directory = $this->imageDirectory();
        if ($directory === null) {
            return null;
        }

        $path = $directory . '/' . $this->image_name;

        return is_file($path) ? $path : null;
    }

    /**
     * Monta o JSON do evento para a intranet.
     * Inclui canal, autor e se há imagem.
     *
     * @return array<string, mixed>
     */
    public function toPayload(?User $creator, ?Conversation $channel, bool $canEdit): array
    {
        return [
            'id' => (int) $this->id,
            'spaceId' => (int) $this->space_id,
            'title' => (string) $this->title,
            'description' => (string) ($this->description ?? ''),
            'locationKind' => (string) $this->location_kind,
            'conversationId' => $this->conversation_id ? (int) $this->conversation_id : null,
            'conversationName' => $channel ? $channel->getDisplayName() : '',
            'locationText' => (string) ($this->location_text ?? ''),
            'startsAt' => (string) $this->starts_at,
            'frequency' => (string) $this->frequency,
            'hasImage' => $this->image_name !== null && $this->image_name !== '',
            'creatorName' => $creator
                ? (string) ($creator->displayName ?? $creator->username ?? 'Usuário')
                : 'Usuário',
            'creatorImageUrl' => Message::resolveAvatarUrl($creator),
            'interestedCount' => $this->interestedCount(),
            'isInterested' => $this->isInterestedBy((int) Yii::$app->user->id),
            'canEdit' => $canEdit,
        ];
    }

    /**
     * Marca ou desmarca o interesse do usuário neste evento.
     * Grava ou apaga a linha em nexchat_space_event_interest.
     */
    public function toggleInterest(int $userId): bool
    {
        $next = !$this->isInterestedBy($userId);
        $this->setInterested($userId, $next);

        return $next;
    }

    /**
     * Diz se o usuário já marcou interesse no evento.
     */
    public function isInterestedBy(int $userId): bool
    {
        if ($userId <= 0 || !self::ensureInterestTable()) {
            return false;
        }

        $table = Yii::$app->db->quoteTableName(self::INTEREST_TABLE);
        $count = Yii::$app->db->createCommand(
            "SELECT COUNT(*) FROM {$table} WHERE event_id = :event AND user_id = :user",
            [':event' => (int) $this->id, ':user' => $userId],
        )->queryScalar();

        return (int) $count > 0;
    }

    /**
     * Conta quantas pessoas marcaram interesse.
     */
    public function interestedCount(): int
    {
        if (!self::ensureInterestTable()) {
            return 0;
        }

        $table = Yii::$app->db->quoteTableName(self::INTEREST_TABLE);

        return (int) Yii::$app->db->createCommand(
            "SELECT COUNT(*) FROM {$table} WHERE event_id = :event",
            [':event' => (int) $this->id],
        )->queryScalar();
    }

    /**
     * Garante a tabela de interesse.
     * Cria nexchat_space_event_interest se a migration ainda não rodou.
     */
    public static function ensureInterestTable(): bool
    {
        $db = Yii::$app->db;
        if ($db->getTableSchema(self::INTEREST_TABLE, true) !== null) {
            return true;
        }

        $table = $db->quoteTableName(self::INTEREST_TABLE);
        $db->createCommand(
            "CREATE TABLE {$table} (
                event_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at DATETIME NULL,
                PRIMARY KEY (event_id, user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        )->execute();
        $db->getSchema()->refreshTableSchema(self::INTEREST_TABLE);

        return $db->getTableSchema(self::INTEREST_TABLE, true) !== null;
    }

    /**
     * Grava ou remove o interesse do usuário.
     */
    public function setInterested(int $userId, bool $interested): void
    {
        if ($userId <= 0 || !self::ensureInterestTable()) {
            return;
        }

        if ($interested) {
            if ($this->isInterestedBy($userId)) {
                return;
            }
            Yii::$app->db->createCommand()->insert(self::INTEREST_TABLE, [
                'event_id' => (int) $this->id,
                'user_id' => $userId,
                'created_at' => date('Y-m-d H:i:s'),
            ])->execute();
            return;
        }

        Yii::$app->db->createCommand()->delete(self::INTEREST_TABLE, [
            'event_id' => (int) $this->id,
            'user_id' => $userId,
        ])->execute();
    }

    private function imageDirectory(): ?string
    {
        $base = Module::ensureUploadPath();
        if ($base === null) {
            return null;
        }

        $directory = $base . '/events';
        if (!is_dir($directory) && !@mkdir($directory, 0775, true) && !is_dir($directory)) {
            return null;
        }

        return $directory;
    }

    private function deleteImageFile(): void
    {
        $path = $this->getImagePath();
        if ($path) {
            @unlink($path);
        }
    }
}
