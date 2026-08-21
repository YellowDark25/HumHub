<?php

namespace humhub\modules\nexchat\components;

use humhub\components\access\StrictAccess;

class SkipMustChangePasswordAccess extends StrictAccess
{
    public function getFixedRules()
    {
        $rules = [];
        foreach (parent::getFixedRules() as $rule) {
            if (($rule[0] ?? '') === self::RULE_MUST_CHANGE_PASSWORD) {
                continue;
            }

            $rules[] = $rule;
        }

        return $rules;
    }
}
