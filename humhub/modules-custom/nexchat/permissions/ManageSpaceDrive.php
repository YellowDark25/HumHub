<?php

namespace humhub\modules\nexchat\permissions;

use humhub\libs\BasePermission;
use humhub\modules\user\models\Group;

/**
 * Permissão de grupo: gerir o drive do espaço (apagar o que outros enviaram).
 * Na tela de permissões aparece na seção Espaço; o padrão é negar, menos no grupo admin.
 */
class ManageSpaceDrive extends BasePermission
{
    protected $id = 'manage_space_drive';

    protected $moduleId = 'nexchat';

    protected $defaultState = self::STATE_DENY;

    /**
     * Define título, descrição e trava o grupo de administradores em Permitir.
     */
    public function init()
    {
        $this->title = 'Gerir arquivos do espaço';
        $this->description = 'Pode apagar arquivos e pastas enviados por outras pessoas no drive do espaço. Quem enviou sempre pode apagar o próprio.';

        if (class_exists(Group::class) && method_exists(Group::class, 'getAdminGroupId')) {
            $this->fixedGroups[] = Group::getAdminGroupId();
        }

        parent::init();
    }

    /**
     * No grupo admin o padrão é permitir; nos demais, negar.
     * @param int $groupId
     */
    public function getDefaultState($groupId)
    {
        if (class_exists(Group::class) && method_exists(Group::class, 'getAdminGroupId')
            && (int) $groupId === (int) Group::getAdminGroupId()) {
            return self::STATE_ALLOW;
        }

        return parent::getDefaultState($groupId);
    }
}
