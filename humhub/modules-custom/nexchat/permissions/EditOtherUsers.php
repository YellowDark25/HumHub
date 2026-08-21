<?php

namespace humhub\modules\nexchat\permissions;

use humhub\libs\BasePermission;
use humhub\modules\user\models\Group;

class EditOtherUsers extends BasePermission
{
    protected $id = 'edit_other_users';

    protected $moduleId = 'nexchat';

    protected $defaultState = self::STATE_DENY;

    public function init()
    {
        $this->title = 'Editar outros usuários';
        $this->description = 'Pode editar o perfil e a conta de outros usuários. Qualquer pessoa já pode alterar o próprio perfil.';

        if (class_exists(Group::class) && method_exists(Group::class, 'getAdminGroupId')) {
            $this->fixedGroups[] = Group::getAdminGroupId();
        }

        parent::init();
    }

    public function getDefaultState($groupId)
    {
        if (class_exists(Group::class) && method_exists(Group::class, 'getAdminGroupId')
            && (int) $groupId === (int) Group::getAdminGroupId()) {
            return self::STATE_ALLOW;
        }

        return parent::getDefaultState($groupId);
    }
}
