<?php

use yii\widgets\ActiveForm;

/* @var $this \humhub\components\View */
/* @var $model \humhub\modules\chatwoot\models\ConfigForm */
?>
<div class="panel panel-default">
    <div class="panel-heading">Configurações do Chatwoot</div>
    <div class="panel-body">
        <p>
            Informe a URL do painel do Chatwoot. Um item será adicionado ao menu superior
            apontando para essa URL. O login no Chatwoot é feito normalmente na própria página.
        </p>

        <?php $form = ActiveForm::begin(); ?>

        <?= $form->field($model, 'url')->textInput(['placeholder' => 'https://chat.suaempresa.com']) ?>

        <?= $form->field($model, 'label')->textInput(['placeholder' => 'Atendimento']) ?>

        <?= $form->field($model, 'visibleTo')->dropDownList([
            'admins' => 'Apenas administradores',
            'all' => 'Todos os usuários logados',
        ]) ?>

        <?= $form->field($model, 'openInNewTab')->checkbox() ?>

        <button type="submit" class="btn btn-primary">Salvar</button>

        <?php ActiveForm::end(); ?>
    </div>
</div>
