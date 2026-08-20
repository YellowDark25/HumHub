<?php

namespace humhub\modules\nexchat\controllers;

use humhub\components\Controller;
use humhub\modules\nexchat\components\BearerLogin;
use humhub\modules\space\models\Space;
use Yii;
use yii\web\Response;

class SpaceImageController extends Controller
{
    public $enableCsrfValidation = false;

    public $layout = false;

    public function beforeAction($action)
    {
        BearerLogin::authenticate();
        if (BearerLogin::hasBearer()) {
            $this->enableCsrfValidation = false;
        }

        return parent::beforeAction($action);
    }

    public function actionUploadImage($id)
    {
        return $this->upload((int) $id, 'image');
    }

    public function actionUploadBanner($id)
    {
        return $this->upload((int) $id, 'banner');
    }

    private function upload(int $spaceId, string $kind)
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        $space = Space::findOne(['id' => $spaceId]);
        if ($space === null) {
            return $this->fail(404, 'Espaço não encontrado.');
        }

        $identity = Yii::$app->user->identity;
        $isSystemAdmin = $identity && method_exists($identity, 'isSystemAdmin')
            ? $identity->isSystemAdmin()
            : false;

        if (!$space->isAdmin() && !$isSystemAdmin) {
            return $this->fail(403, 'Apenas administradores do espaço podem alterar as imagens.');
        }

        $imageDataUrl = trim((string) Yii::$app->request->post('image', ''));
        if (!preg_match('/^data:image\/(jpeg|jpg|png|gif|webp);base64,/i', $imageDataUrl)) {
            return $this->fail(400, 'Envie uma imagem JPG, PNG, GIF ou WebP.');
        }

        $payload = explode(',', $imageDataUrl, 2)[1] ?? '';
        $binary = base64_decode($payload, true);
        if ($binary === false || $binary === '') {
            return $this->fail(400, 'Envie uma imagem JPG, PNG, GIF ou WebP.');
        }

        $tempFile = tempnam(sys_get_temp_dir(), 'spcimg');
        if ($tempFile === false || file_put_contents($tempFile, $binary) === false) {
            return $this->fail(500, 'Não foi possível processar a imagem.');
        }

        try {
            if ($kind === 'banner') {
                $space->getProfileBannerImage()->setNew($tempFile);
            } else {
                $space->getProfileImage()->setNew($tempFile);
            }
        } catch (\Throwable $error) {
            Yii::error($error->getMessage(), 'nexchat');
            return $this->fail(400, 'Não foi possível atualizar a imagem do espaço.');
        } finally {
            if (is_file($tempFile)) {
                @unlink($tempFile);
            }
        }

        return ['ok' => true];
    }

    private function fail(int $status, string $message): array
    {
        Yii::$app->response->statusCode = $status;

        return ['message' => $message];
    }
}
