<?php

namespace humhub\modules\nexchat\controllers;

use humhub\components\Controller;
use humhub\modules\nexchat\components\BearerLogin;
use humhub\modules\nexchat\models\Message;
use humhub\modules\nexchat\models\SpaceDriveFile;
use humhub\modules\nexchat\models\SpaceFolder;
use humhub\modules\nexchat\Module;
use humhub\modules\nexchat\permissions\ManageSpaceDrive;
use humhub\modules\space\models\Membership;
use humhub\modules\space\models\Space;
use humhub\modules\user\models\User;
use Yii;
use yii\web\Response;
use yii\web\UploadedFile;

/**
 * Drive de arquivos do espaço: pastas, subpastas e upload.
 * Qualquer membro lê e grava; autor ou gestor apaga.
 */
class SpaceDriveController extends Controller
{
    public $enableCsrfValidation = false;

    public $layout = false;

    public function beforeAction($action)
    {
        BearerLogin::authenticate();
        if (BearerLogin::hasBearer()) {
            $this->enableCsrfValidation = false;
        }

        Yii::$app->response->format = Response::FORMAT_JSON;

        return parent::beforeAction($action);
    }

    /**
     * Lista a pasta pedida: caminho, subpastas e arquivos.
     * Pasta 0 é a raiz do espaço.
     */
    public function actionIndex()
    {
        $space = $this->requireReadableSpace((int) Yii::$app->request->get('spaceId', 0));
        if (!($space instanceof Space)) {
            return $space;
        }

        $folderId = (int) Yii::$app->request->get('folderId', 0);
        $folder = $this->loadFolder($space, $folderId);
        if ($folderId > 0 && !($folder instanceof SpaceFolder)) {
            return $folder;
        }

        $canManage = $this->canManageSpace($space);

        return [
            'success' => true,
            'folderId' => $folder ? (int) $folder->id : 0,
            'folderName' => $folder ? (string) $folder->name : 'Arquivos',
            'ancestors' => $this->ancestorsOf($space, $folder),
            'folders' => array_map(
                fn(SpaceFolder $item) => $this->folderPayload($item, $canManage),
                $this->childFolders($space, $folder),
            ),
            'files' => array_map(
                fn(SpaceDriveFile $file) => $this->filePayload($space, $file, $canManage),
                $this->filesIn($space, $folder),
            ),
        ];
    }

    /**
     * Cria uma pasta na pasta atual.
     * Recusa nome vazio, duplicado no mesmo nível ou profundidade acima do limite.
     */
    public function actionCreateFolder()
    {
        $space = $this->requireWritableSpace((int) Yii::$app->request->post('spaceId', 0));
        if (!($space instanceof Space)) {
            return $space;
        }

        $parentId = (int) Yii::$app->request->post('parentId', 0);
        $parent = $this->loadFolder($space, $parentId);
        if ($parentId > 0 && !($parent instanceof SpaceFolder)) {
            return $parent;
        }

        $name = $this->normalizedFolderName((string) Yii::$app->request->post('name', ''));
        if ($name === '') {
            return $this->fail(400, 'Informe o nome da pasta.');
        }

        if ($this->folderDepth($parent) >= SpaceFolder::DEPTH_MAX) {
            return $this->fail(400, 'Não é possível criar pastas mais profundas.');
        }

        if ($this->siblingExists($space, $parent, $name)) {
            return $this->fail(400, 'Já existe uma pasta com este nome aqui.');
        }

        $folder = new SpaceFolder([
            'space_id' => (int) $space->id,
            'parent_id' => $parent ? (int) $parent->id : null,
            'name' => $name,
            'created_by' => (int) Yii::$app->user->id,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        if (!$folder->save()) {
            return $this->fail(400, 'Não foi possível criar a pasta.');
        }

        return [
            'success' => true,
            'folder' => $this->folderPayload($folder, $this->canManageSpace($space)),
        ];
    }

    /**
     * Apaga a pasta e, em cascata, subpastas e arquivos.
     */
    public function actionDeleteFolder()
    {
        $space = $this->requireWritableSpace((int) Yii::$app->request->post('spaceId', 0));
        if (!($space instanceof Space)) {
            return $space;
        }

        $folder = $this->loadFolder($space, (int) Yii::$app->request->post('folderId', 0));
        if (!($folder instanceof SpaceFolder)) {
            return $folder;
        }

        if (!$this->canDeleteFolder($space, $folder)) {
            return $this->fail(403, 'Você não pode excluir esta pasta.');
        }

        $this->deleteFolderTree($folder);

        return ['success' => true];
    }

    /**
     * Grava um ou mais arquivos na pasta atual.
     */
    public function actionUpload()
    {
        $space = $this->requireWritableSpace((int) Yii::$app->request->post('spaceId', 0));
        if (!($space instanceof Space)) {
            return $space;
        }

        $folderId = (int) Yii::$app->request->post('folderId', 0);
        $folder = $this->loadFolder($space, $folderId);
        if ($folderId > 0 && !($folder instanceof SpaceFolder)) {
            return $folder;
        }

        $description = trim((string) Yii::$app->request->post('description', ''));
        if (mb_strlen($description) > 500) {
            return $this->fail(400, 'A descrição pode ter no máximo 500 caracteres.');
        }

        $uploaded = UploadedFile::getInstancesByName('files');
        if ($uploaded === []) {
            $single = UploadedFile::getInstanceByName('files');
            $uploaded = $single ? [$single] : [];
        }
        if ($uploaded === []) {
            return $this->fail(400, 'Selecione pelo menos um arquivo.');
        }

        $saved = [];
        $canManage = $this->canManageSpace($space);
        foreach ($uploaded as $item) {
            $stored = $this->storeFile($space, $folder, $item, $description);
            if (is_string($stored)) {
                return $this->fail(400, $stored);
            }

            $saved[] = $this->filePayload($space, $stored, $canManage);
        }

        return ['success' => true, 'files' => $saved];
    }

    /**
     * Apaga um arquivo do drive.
     */
    public function actionDeleteFile()
    {
        $space = $this->requireWritableSpace((int) Yii::$app->request->post('spaceId', 0));
        if (!($space instanceof Space)) {
            return $space;
        }

        $file = $this->loadFile($space, (int) Yii::$app->request->post('fileId', 0));
        if (!($file instanceof SpaceDriveFile)) {
            return $file;
        }

        if (!$this->canDeleteFile($space, $file)) {
            return $this->fail(403, 'Você não pode excluir este arquivo.');
        }

        $file->delete();

        return ['success' => true];
    }

    /**
     * Envia o binário do arquivo para download.
     */
    public function actionFile()
    {
        Yii::$app->response->format = Response::FORMAT_RAW;

        $space = $this->requireReadableSpace((int) Yii::$app->request->get('spaceId', 0));
        if (!($space instanceof Space)) {
            Yii::$app->response->format = Response::FORMAT_JSON;

            return $space;
        }

        $file = $this->loadFile($space, (int) Yii::$app->request->get('id', 0));
        if (!($file instanceof SpaceDriveFile)) {
            Yii::$app->response->format = Response::FORMAT_JSON;

            return $file;
        }

        $path = $file->getFilePath();
        if (!is_file($path)) {
            Yii::$app->response->format = Response::FORMAT_JSON;

            return $this->fail(404, 'Arquivo indisponível.');
        }

        $inline = $file->is_image || $file->isAudio() || $file->mime === 'application/pdf';

        return Yii::$app->response->sendFile($path, $file->file_name, [
            'mimeType' => $file->mime ?: 'application/octet-stream',
            'inline' => $inline,
        ]);
    }

    /**
     * @return Space|array
     */
    private function requireReadableSpace(int $spaceId)
    {
        $space = $this->loadSpace($spaceId);
        if (!($space instanceof Space)) {
            return $space;
        }

        if (!$this->canAccessSpace($space)) {
            return $this->fail(403, 'Você não tem acesso a este espaço.');
        }

        return $space;
    }

    /**
     * @return Space|array
     */
    private function requireWritableSpace(int $spaceId)
    {
        $space = $this->requireReadableSpace($spaceId);
        if (!($space instanceof Space)) {
            return $space;
        }

        if ($this->currentMembership($space) === null && !$this->isSystemAdmin()) {
            return $this->fail(403, 'Só membros podem alterar os arquivos.');
        }

        return $space;
    }

    /**
     * @return Space|array
     */
    private function loadSpace(int $spaceId)
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        if ($spaceId <= 0) {
            return $this->fail(400, 'Espaço inválido.');
        }

        $space = Space::findOne(['id' => $spaceId]);
        if (!$space) {
            return $this->fail(404, 'Espaço não encontrado.');
        }

        return $space;
    }

    /**
     * @return SpaceFolder|array|null
     */
    private function loadFolder(Space $space, int $folderId)
    {
        if ($folderId <= 0) {
            return null;
        }

        $folder = SpaceFolder::findOne([
            'id' => $folderId,
            'space_id' => (int) $space->id,
        ]);
        if (!$folder) {
            return $this->fail(404, 'Pasta não encontrada.');
        }

        return $folder;
    }

    /**
     * @return SpaceDriveFile|array
     */
    private function loadFile(Space $space, int $fileId)
    {
        if ($fileId <= 0) {
            return $this->fail(400, 'Arquivo inválido.');
        }

        $file = SpaceDriveFile::findOne([
            'id' => $fileId,
            'space_id' => (int) $space->id,
        ]);
        if (!$file) {
            return $this->fail(404, 'Arquivo não encontrado.');
        }

        return $file;
    }

    /**
     * @return SpaceFolder[]
     */
    private function childFolders(Space $space, ?SpaceFolder $parent): array
    {
        $query = SpaceFolder::find()
            ->where(['space_id' => (int) $space->id])
            ->orderBy(['name' => SORT_ASC]);
        if ($parent) {
            $query->andWhere(['parent_id' => (int) $parent->id]);
        } else {
            $query->andWhere(['parent_id' => null]);
        }

        return $query->all();
    }

    /**
     * @return SpaceDriveFile[]
     */
    private function filesIn(Space $space, ?SpaceFolder $parent): array
    {
        $query = SpaceDriveFile::find()
            ->where(['space_id' => (int) $space->id])
            ->orderBy(['created_at' => SORT_DESC, 'id' => SORT_DESC]);
        if ($parent) {
            $query->andWhere(['folder_id' => (int) $parent->id]);
        } else {
            $query->andWhere(['folder_id' => null]);
        }

        return $query->all();
    }

    /**
     * @return array<int, array{id: int, name: string}>
     */
    private function ancestorsOf(Space $space, ?SpaceFolder $folder): array
    {
        $path = [['id' => 0, 'name' => 'Arquivos']];
        if (!$folder) {
            return $path;
        }

        $trail = [];
        $current = $folder;
        $guard = 0;
        while ($current && $guard < SpaceFolder::DEPTH_MAX) {
            array_unshift($trail, [
                'id' => (int) $current->id,
                'name' => (string) $current->name,
            ]);
            $parentId = (int) ($current->parent_id ?: 0);
            $current = $parentId > 0
                ? SpaceFolder::findOne(['id' => $parentId, 'space_id' => (int) $space->id])
                : null;
            $guard++;
        }

        return array_merge($path, $trail);
    }

    private function folderDepth(?SpaceFolder $folder): int
    {
        $depth = 0;
        $current = $folder;
        while ($current && $depth < SpaceFolder::DEPTH_MAX) {
            $depth++;
            $parentId = (int) ($current->parent_id ?: 0);
            $current = $parentId > 0 ? SpaceFolder::findOne($parentId) : null;
        }

        return $depth;
    }

    private function siblingExists(Space $space, ?SpaceFolder $parent, string $name): bool
    {
        $query = SpaceFolder::find()->where([
            'space_id' => (int) $space->id,
            'name' => $name,
        ]);
        if ($parent) {
            $query->andWhere(['parent_id' => (int) $parent->id]);
        } else {
            $query->andWhere(['parent_id' => null]);
        }

        return $query->exists();
    }

    private function normalizedFolderName(string $name): string
    {
        $trimmed = trim(preg_replace('/\s+/', ' ', $name) ?? $name);

        return mb_substr($trimmed, 0, SpaceFolder::NAME_MAX);
    }

    /**
     * @return SpaceDriveFile|string
     */
    private function storeFile(Space $space, ?SpaceFolder $folder, UploadedFile $uploaded, string $description)
    {
        if ($uploaded->hasError) {
            return 'Erro no upload de "' . $uploaded->name . '".';
        }

        if ($uploaded->size > Module::MAX_UPLOAD_SIZE) {
            return 'Arquivo "' . $uploaded->name . '" excede o limite de 25 MB.';
        }

        $extension = strtolower((string) $uploaded->extension);
        if ($extension === '' || !in_array($extension, Module::ALLOWED_EXTENSIONS, true)) {
            return 'Tipo de arquivo não permitido: "' . $uploaded->name . '".';
        }

        $basePath = Module::ensureUploadPath();
        if ($basePath === null) {
            return 'Pasta de arquivos indisponível.';
        }

        $mime = (string) ($uploaded->type ?: 'application/octet-stream');
        $storedName = bin2hex(random_bytes(16)) . '.' . $extension;
        $targetPath = $basePath . DIRECTORY_SEPARATOR . $storedName;
        if (!$uploaded->saveAs($targetPath)) {
            return 'Não foi possível salvar "' . $uploaded->name . '".';
        }

        $file = new SpaceDriveFile([
            'space_id' => (int) $space->id,
            'folder_id' => $folder ? (int) $folder->id : null,
            'file_name' => mb_substr((string) $uploaded->name, 0, 255),
            'stored_name' => $storedName,
            'mime' => $mime,
            'size' => (int) $uploaded->size,
            'is_image' => str_starts_with($mime, 'image/') && $extension !== 'svg',
            'description' => $description === '' ? null : $description,
            'created_by' => (int) Yii::$app->user->id,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        if (!$file->save()) {
            @unlink($targetPath);

            return 'Falha ao registrar "' . $uploaded->name . '".';
        }

        return $file;
    }

    private function deleteFolderTree(SpaceFolder $folder): void
    {
        foreach ($folder->children as $child) {
            $this->deleteFolderTree($child);
        }

        foreach ($folder->files as $file) {
            $file->delete();
        }

        $folder->delete();
    }

    /**
     * Serializa a pasta para a intranet: nome, dono, foto, data e se pode apagar.
     */
    private function folderPayload(SpaceFolder $folder, bool $canManage): array
    {
        $owner = $this->ownerFields((int) $folder->created_by);

        return [
            'id' => (int) $folder->id,
            'name' => (string) $folder->name,
            'parentId' => (int) ($folder->parent_id ?: 0),
            'authorName' => $owner['authorName'],
            'avatarUrl' => $owner['avatarUrl'],
            'createdAt' => $folder->created_at,
            'canDelete' => $canManage || (int) $folder->created_by === (int) Yii::$app->user->id,
        ];
    }

    /**
     * Serializa o arquivo para a intranet: metadados, dono, foto e se pode apagar.
     */
    private function filePayload(Space $space, SpaceDriveFile $file, bool $canManage): array
    {
        $owner = $this->ownerFields((int) $file->created_by);

        return [
            'id' => (int) $file->id,
            'folderId' => (int) ($file->folder_id ?: 0),
            'origin' => 'drive',
            'name' => (string) $file->file_name,
            'mime' => (string) ($file->mime ?? ''),
            'sizeBytes' => (int) ($file->size ?? 0),
            'isImage' => (bool) $file->is_image,
            'isAudio' => $file->isAudio(),
            'description' => (string) ($file->description ?? ''),
            'authorName' => $owner['authorName'],
            'avatarUrl' => $owner['avatarUrl'],
            'publishedAt' => $file->created_at,
            'canDelete' => $canManage || (int) $file->created_by === (int) Yii::$app->user->id,
            'spaceId' => (int) $space->id,
        ];
    }

    /**
     * Nome e foto do dono da pasta ou arquivo.
     * Busca o usuário uma vez; sem registro, nome genérico e URL vazia.
     * @return array{authorName: string, avatarUrl: string}
     */
    private function ownerFields(int $userId): array
    {
        if ($userId <= 0) {
            return [
                'authorName' => 'Usuário',
                'avatarUrl' => '',
            ];
        }

        $user = User::findOne($userId);
        if (!$user) {
            return [
                'authorName' => 'Usuário',
                'avatarUrl' => '',
            ];
        }

        return [
            'authorName' => (string) ($user->displayName ?? $user->username ?? 'Usuário'),
            'avatarUrl' => Message::resolveAvatarUrl($user),
        ];
    }

    private function canDeleteFolder(Space $space, SpaceFolder $folder): bool
    {
        return $this->canManageSpace($space)
            || (int) $folder->created_by === (int) Yii::$app->user->id;
    }

    private function canDeleteFile(Space $space, SpaceDriveFile $file): bool
    {
        return $this->canManageSpace($space)
            || (int) $file->created_by === (int) Yii::$app->user->id;
    }

    /**
     * Diz se o ator pode gerir o drive (apagar o que não criou).
     * Admin do sistema, permissão de grupo "Gerir arquivos do espaço",
     * ou admin/moderador do próprio espaço.
     */
    private function canManageSpace(Space $space): bool
    {
        if ($this->isSystemAdmin()) {
            return true;
        }

        if (Yii::$app->user->can(new ManageSpaceDrive())) {
            return true;
        }

        if (method_exists($space, 'isAdmin') && $space->isAdmin()) {
            return true;
        }

        if (method_exists($space, 'isModerator') && $space->isModerator()) {
            return true;
        }

        $membership = $this->currentMembership($space);
        if (!$membership || !$membership->hasAttribute('group_id')) {
            return false;
        }

        return in_array((string) $membership->group_id, $this->manageGroupIds(), true);
    }

    /**
     * Grupos do espaço que podem gerir o drive.
     * Lê as constantes do HumHub quando existem (owner, admin, moderator).
     */
    private function manageGroupIds(): array
    {
        $groups = [];
        foreach (['USERGROUP_OWNER', 'USERGROUP_ADMIN', 'USERGROUP_MODERATOR'] as $constant) {
            if (defined(Space::class . '::' . $constant)) {
                $groups[] = (string) constant(Space::class . '::' . $constant);
            }
        }

        return $groups;
    }

    private function canAccessSpace(Space $space): bool
    {
        if ($this->isSystemAdmin()) {
            return true;
        }

        if ((int) $space->visibility !== Space::VISIBILITY_NONE) {
            return true;
        }

        return $space->isMember() || $this->currentMembership($space) !== null;
    }

    private function currentMembership(Space $space): ?Membership
    {
        return Membership::findOne([
            'space_id' => $space->id,
            'user_id' => (int) Yii::$app->user->id,
            'status' => Membership::STATUS_MEMBER,
        ]);
    }

    private function isSystemAdmin(): bool
    {
        $identity = Yii::$app->user->identity;

        return $identity && method_exists($identity, 'isSystemAdmin') && $identity->isSystemAdmin();
    }

    /**
     * @return array{message: string}
     */
    private function fail(int $status, string $message): array
    {
        Yii::$app->response->statusCode = $status;

        return ['success' => false, 'message' => $message];
    }
}
