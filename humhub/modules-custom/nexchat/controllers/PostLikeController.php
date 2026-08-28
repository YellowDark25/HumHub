<?php

namespace humhub\modules\nexchat\controllers;

use humhub\components\Controller;
use humhub\modules\like\models\Like;
use humhub\modules\nexchat\components\BearerLogin;
use humhub\modules\post\models\Post;
use Yii;
use yii\web\Response;

/**
 * Curtidas das publicações do feed para a intranet.
 * GET lista quais o ator já curtiu; POST alterna a curtida do post.
 */
class PostLikeController extends Controller
{
    private const ID_LIMIT = 50;

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
     * Lista os ids das publicações que o ator atual curtiu.
     * Lê ids na query (até 50); sem autenticação, recusa.
     */
    public function actionIndex()
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        if (!class_exists(Like::class)) {
            return ['likedIds' => []];
        }

        $ids = $this->readIds((string) Yii::$app->request->get('ids', ''));
        if ($ids === []) {
            return ['likedIds' => []];
        }

        $liked = Like::find()
            ->select('object_id')
            ->where([
                'object_model' => Post::class,
                'object_id' => $ids,
                'created_by' => (int) Yii::$app->user->id,
            ])
            ->column();

        return ['likedIds' => array_map('intval', $liked)];
    }

    /**
     * Alterna a curtida do post (cria se não existe, apaga se existe).
     * Lê postId no corpo; recusa visitante ou post invisível.
     */
    public function actionToggle()
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        if (!class_exists(Like::class)) {
            return $this->fail(404, 'Curtidas desativadas.');
        }

        $body = Yii::$app->request->getBodyParams();
        $post = $this->loadPost((int) ($body['postId'] ?? 0));
        if (!($post instanceof Post)) {
            return $post;
        }

        if (!$this->canLikePost($post)) {
            return $this->fail(403, 'Você não pode curtir esta publicação.');
        }

        $like = Like::findOne([
            'object_model' => Post::class,
            'object_id' => $post->id,
            'created_by' => (int) Yii::$app->user->id,
        ]);

        if ($like) {
            $like->delete();
            $liked = false;
        } else {
            $like = new Like([
                'object_model' => Post::class,
                'object_id' => $post->id,
            ]);
            if (!$like->save()) {
                return $this->fail(400, 'Não foi possível curtir esta publicação.');
            }
            $liked = true;
        }

        return [
            'liked' => $liked,
            'likeCount' => $this->likeCount($post),
        ];
    }

    /**
     * Carrega o post pelo id e confirma se o ator pode vê-lo.
     * @return Post|array
     */
    private function loadPost(int $postId)
    {
        if ($postId <= 0) {
            return $this->fail(400, 'Publicação inválida.');
        }

        $post = Post::findOne($postId);
        if (!$post) {
            return $this->fail(404, 'Publicação não encontrada.');
        }

        if (isset($post->content) && method_exists($post->content, 'canView') && !$post->content->canView()) {
            return $this->fail(403, 'Você não tem acesso a esta publicação.');
        }

        return $post;
    }

    /**
     * Diz se o módulo Like permite curtir este post.
     */
    private function canLikePost(Post $post): bool
    {
        $module = Yii::$app->getModule('like');
        if (!$module || (property_exists($module, 'isEnabled') && !$module->isEnabled)) {
            return false;
        }

        if (method_exists($module, 'canLike')) {
            return (bool) $module->canLike($post);
        }

        return true;
    }

    /**
     * Quantidade atual de curtidas do post.
     */
    private function likeCount(Post $post): int
    {
        return (int) Like::find()
            ->where([
                'object_model' => Post::class,
                'object_id' => $post->id,
            ])
            ->count();
    }

    /**
     * Lê ids positivos da query, no máximo ID_LIMIT.
     * @return int[]
     */
    private function readIds(string $raw): array
    {
        $ids = [];
        foreach (explode(',', $raw) as $value) {
            $id = (int) trim($value);
            if ($id > 0) {
                $ids[] = $id;
            }
        }

        return array_slice(array_values(array_unique($ids)), 0, self::ID_LIMIT);
    }

    /**
     * Resposta de erro JSON com o status HTTP.
     */
    private function fail(int $status, string $message): array
    {
        Yii::$app->response->statusCode = $status;

        return ['message' => $message];
    }
}
