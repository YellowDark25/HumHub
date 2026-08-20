<?php

use yii\helpers\Html;

/* @var $this \humhub\components\View */
$this->beginContent('@nexchat/views/index/_layout.php');
?>
<div class="nexchat-welcome">
    <div class="nexchat-welcome-icon">#</div>
    <h2>Bem-vindo ao Chat</h2>
    <p>Selecione um canal ou mensagem direta na barra lateral, ou crie uma nova conversa.</p>
    <ul class="nexchat-welcome-tips">
        <li><strong># canais</strong> — conversas em grupo</li>
        <li><strong>@ DMs</strong> — mensagens individuais</li>
        <li>Mensagens em <strong>tempo real</strong> via Mercure</li>
    </ul>
</div>
<?php $this->endContent(); ?>
