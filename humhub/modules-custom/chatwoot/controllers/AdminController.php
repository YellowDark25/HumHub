<?php

namespace humhub\modules\chatwoot\controllers;

use humhub\modules\admin\components\Controller;
use humhub\modules\chatwoot\models\ConfigForm;
use Yii;

class AdminController extends Controller
{
    public function actionIndex()
    {
        $model = (new ConfigForm())->loadSettings();

        if ($model->load(Yii::$app->request->post()) && $model->save()) {
            $this->view->saved();

            return $this->redirect(['index']);
        }

        return $this->render('index', ['model' => $model]);
    }
}
