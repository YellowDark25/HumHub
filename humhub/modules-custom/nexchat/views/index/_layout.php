<?php

/* @var $this \humhub\components\View */
/* @var $content string */
?>
<div class="nexchat-app" id="nexchat-app">
    <?= $this->render('_sidebar', $this->params['nexchatSidebar'] ?? []) ?>
    <main class="nexchat-main">
        <?= $content ?>
    </main>
</div>
