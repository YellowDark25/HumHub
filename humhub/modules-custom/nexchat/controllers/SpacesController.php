<?php

namespace humhub\modules\nexchat\controllers;

use humhub\components\Controller;
use humhub\modules\nexchat\components\BearerLogin;
use humhub\modules\space\models\Membership;
use humhub\modules\space\models\Space;
use Yii;
use yii\web\Response;

class SpacesController extends Controller
{
    private const SPACE_LIMIT = 50;

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

    public function actionIndex()
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        $spaces = [];
        foreach ($this->memberSpaces() as $space) {
            $spaces[] = $this->spacePayload($space);
        }

        return ['spaces' => $spaces];
    }

    public function actionView()
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        $space = $this->loadSpace((int) Yii::$app->request->get('id'));
        if (!($space instanceof Space)) {
            return $space;
        }

        if (!$this->canAccessSpace($space)) {
            return $this->fail(403, 'Você não tem acesso a este espaço.');
        }

        return $this->spacePayload($space);
    }

    /**
     * @return Space[]
     */
    private function memberSpaces(): array
    {
        $spaceIds = Membership::find()
            ->select('space_id')
            ->where([
                'user_id' => (int) Yii::$app->user->id,
                'status' => Membership::STATUS_MEMBER,
            ])
            ->column();

        if (!$spaceIds) {
            return [];
        }

        return Space::find()
            ->where(['id' => $spaceIds, 'status' => Space::STATUS_ENABLED])
            ->orderBy(['name' => SORT_ASC])
            ->limit(self::SPACE_LIMIT)
            ->all();
    }

    private function loadSpace(int $spaceId)
    {
        if ($spaceId <= 0) {
            return $this->fail(400, 'Espaço inválido.');
        }

        $space = Space::findOne(['id' => $spaceId]);
        if (!$space) {
            return $this->fail(404, 'Espaço não encontrado.');
        }

        return $space;
    }

    private function canAccessSpace(Space $space): bool
    {
        $identity = Yii::$app->user->identity;
        if ($identity && method_exists($identity, 'isSystemAdmin') && $identity->isSystemAdmin()) {
            return true;
        }

        return $space->isMember();
    }

    private function spacePayload(Space $space): array
    {
        return [
            'id' => (int) $space->id,
            'guid' => (string) $space->guid,
            'name' => (string) $space->name,
            'description' => $space->description !== null ? (string) $space->description : null,
            'contentcontainer_id' => $space->hasAttribute('contentcontainer_id')
                ? (int) $space->contentcontainer_id
                : 0,
            'visibility' => (int) $space->visibility,
            'status' => (int) $space->status,
        ];
    }

    private function fail(int $status, string $message): array
    {
        Yii::$app->response->statusCode = $status;

        return ['message' => $message];
    }
}
