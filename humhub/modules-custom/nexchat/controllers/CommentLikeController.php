<?php

namespace humhub\modules\nexchat\controllers;

use humhub\components\Controller;
use humhub\modules\comment\models\Comment;
use humhub\modules\like\models\Like;
use humhub\modules\nexchat\components\BearerLogin;
use Yii;
use yii\web\Response;

/**
 * Curtidas dos comentários do feed para a intranet.
 * GET lista totais e se o ator já curtiu; POST alterna a curtida.
 */
class CommentLikeController extends Controller
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
     * Lista curtidas dos comentários pedidos (total e se o ator já curtiu).
     * Lê ids na query (até 50); sem autenticação, recusa.
     */
    public function actionIndex()
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        $ids = $this->readIds((string) Yii::$app->request->get('ids', ''));
        if ($ids === [] || !class_exists(Like::class)) {
            return ['items' => []];
        }

        $counts = $this->likeCounts($ids);
        $liked = $this->likedIds($ids);

        $items = [];
        foreach ($ids as $id) {
            $items[] = [
                'id' => $id,
                'likeCount' => $counts[$id] ?? 0,
                'liked' => isset($liked[$id]),
            ];
        }

        return ['items' => $items];
    }

    /**
     * Alterna a curtida do comentário (cria se não existe, apaga se existe).
     * Lê commentId no corpo; recusa visitante ou comentário invisível.
     */
    public function actionToggle()
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        if (!class_exists(Like::class) || !class_exists(Comment::class)) {
            return $this->fail(404, 'Curtidas desativadas.');
        }

        $body = Yii::$app->request->getBodyParams();
        $comment = $this->loadComment((int) ($body['commentId'] ?? 0));
        if (!($comment instanceof Comment)) {
            return $comment;
        }

        if (!$this->canLikeComment($comment)) {
            return $this->fail(403, 'Você não pode curtir este comentário.');
        }

        $like = Like::findOne([
            'object_model' => Comment::class,
            'object_id' => $comment->id,
            'created_by' => (int) Yii::$app->user->id,
        ]);

        if ($like) {
            $like->delete();
            $liked = false;
        } else {
            $like = new Like([
                'object_model' => Comment::class,
                'object_id' => $comment->id,
            ]);
            if (!$like->save()) {
                return $this->fail(400, 'Não foi possível curtir este comentário.');
            }
            $liked = true;
        }

        return [
            'liked' => $liked,
            'likeCount' => $this->likeCount($comment),
        ];
    }

    /**
     * Carrega o comentário pelo id e confirma se o ator pode vê-lo.
     * @return Comment|array
     */
    private function loadComment(int $commentId)
    {
        if ($commentId <= 0) {
            return $this->fail(400, 'Comentário inválido.');
        }

        $comment = Comment::findOne($commentId);
        if (!$comment) {
            return $this->fail(404, 'Comentário não encontrado.');
        }

        if (isset($comment->content) && method_exists($comment->content, 'canView') && !$comment->content->canView()) {
            return $this->fail(403, 'Você não tem acesso a este comentário.');
        }

        return $comment;
    }

    /**
     * Diz se o módulo Like permite curtir este comentário.
     */
    private function canLikeComment(Comment $comment): bool
    {
        $module = Yii::$app->getModule('like');
        if (!$module || (property_exists($module, 'isEnabled') && !$module->isEnabled)) {
            return false;
        }

        if (method_exists($module, 'canLike')) {
            return (bool) $module->canLike($comment);
        }

        return true;
    }

    /**
     * Quantidade atual de curtidas do comentário.
     */
    private function likeCount(Comment $comment): int
    {
        return (int) Like::find()
            ->where([
                'object_model' => Comment::class,
                'object_id' => $comment->id,
            ])
            ->count();
    }

    /**
     * Totais de curtida por id de comentário.
     * @param int[] $ids
     * @return array<int, int>
     */
    private function likeCounts(array $ids): array
    {
        $rows = Like::find()
            ->select('object_id, COUNT(*) AS total')
            ->where([
                'object_model' => Comment::class,
                'object_id' => $ids,
            ])
            ->groupBy('object_id')
            ->asArray()
            ->all();

        $counts = [];
        foreach ($rows as $row) {
            $counts[(int) $row['object_id']] = (int) $row['total'];
        }

        return $counts;
    }

    /**
     * Ids da leva que o ator atual já curtiu, indexados pelo id.
     * @param int[] $ids
     * @return array<int, true>
     */
    private function likedIds(array $ids): array
    {
        $liked = Like::find()
            ->select('object_id')
            ->where([
                'object_model' => Comment::class,
                'object_id' => $ids,
                'created_by' => (int) Yii::$app->user->id,
            ])
            ->column();

        $map = [];
        foreach ($liked as $id) {
            $map[(int) $id] = true;
        }

        return $map;
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
