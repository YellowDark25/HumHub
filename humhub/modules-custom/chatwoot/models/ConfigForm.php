<?php

namespace humhub\modules\chatwoot\models;

use humhub\modules\chatwoot\Module;
use Yii;
use yii\base\Model;

class ConfigForm extends Model
{
    public $url;
    public $label;
    public $visibleTo;
    public $openInNewTab;

    public function rules()
    {
        return [
            [['url'], 'trim'],
            [['url'], 'required'],
            [['url'], 'url', 'defaultScheme' => 'https'],
            [['label'], 'string', 'max' => 50],
            [['visibleTo'], 'in', 'range' => ['admins', 'all']],
            [['openInNewTab'], 'boolean'],
        ];
    }

    public function attributeLabels()
    {
        return [
            'url' => 'URL do painel do Chatwoot',
            'label' => 'Texto do menu',
            'visibleTo' => 'Exibir para',
            'openInNewTab' => 'Abrir em nova aba',
        ];
    }

    public function loadSettings(): self
    {
        $settings = $this->getModule()->settings;

        $this->url = $settings->get('url', '');
        $this->label = $settings->get('label', 'Atendimento');
        $this->visibleTo = $settings->get('visibleTo', 'admins');
        $this->openInNewTab = (bool) $settings->get('openInNewTab', '1');

        return $this;
    }

    public function save(): bool
    {
        if (!$this->validate()) {
            return false;
        }

        $settings = $this->getModule()->settings;

        $settings->set('url', trim((string) $this->url));
        $settings->set('label', trim((string) $this->label) ?: 'Atendimento');
        $settings->set('visibleTo', $this->visibleTo === 'all' ? 'all' : 'admins');
        $settings->set('openInNewTab', $this->openInNewTab ? '1' : '0');

        return true;
    }

    private function getModule(): Module
    {
        /** @var Module $module */
        $module = Yii::$app->getModule('chatwoot');

        return $module;
    }
}
