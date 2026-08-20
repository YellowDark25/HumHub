<?php

namespace humhub\modules\chatwoot;

use Yii;
use yii\helpers\Url;

class Module extends \humhub\components\Module
{
    public function getName()
    {
        return 'Chatwoot';
    }

    public function getDescription()
    {
        return Yii::t('ChatwootModule.base', 'Adiciona um item no menu superior que abre o painel do Chatwoot.');
    }

    public function getConfigUrl()
    {
        return Url::to(['/chatwoot/admin/index']);
    }

    public function getPanelUrl(): string
    {
        return trim((string) $this->settings->get('url', ''));
    }

    public function isConfigured(): bool
    {
        return $this->getPanelUrl() !== '';
    }

    public function getMenuLabel(): string
    {
        $label = trim((string) $this->settings->get('label', ''));

        return $label !== '' ? $label : 'Atendimento';
    }

    public function getVisibleTo(): string
    {
        return $this->settings->get('visibleTo', 'admins') === 'all' ? 'all' : 'admins';
    }

    public function openInNewTab(): bool
    {
        return (bool) $this->settings->get('openInNewTab', '1');
    }
}
