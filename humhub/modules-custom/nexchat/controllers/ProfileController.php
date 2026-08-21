<?php

namespace humhub\modules\nexchat\controllers;

use humhub\components\Controller;
use humhub\modules\nexchat\components\BearerLogin;
use humhub\modules\user\models\fieldtype\BaseType;
use humhub\modules\user\models\fieldtype\Birthday;
use humhub\modules\user\models\fieldtype\Checkbox;
use humhub\modules\user\models\fieldtype\CheckboxList;
use humhub\modules\user\models\fieldtype\CountrySelect;
use humhub\modules\user\models\fieldtype\Date;
use humhub\modules\user\models\fieldtype\DateTime;
use humhub\modules\user\models\fieldtype\MarkdownEditor;
use humhub\modules\user\models\fieldtype\Number;
use humhub\modules\user\models\fieldtype\Select;
use humhub\modules\user\models\fieldtype\Template;
use humhub\modules\user\models\fieldtype\Text;
use humhub\modules\user\models\fieldtype\TextArea;
use humhub\modules\user\models\fieldtype\UserEmail;
use humhub\modules\user\models\fieldtype\UserGroupMemberships;
use humhub\modules\user\models\fieldtype\UserLastLogin;
use humhub\modules\user\models\fieldtype\UserMemberSince;
use humhub\modules\user\models\fieldtype\UserName;
use humhub\modules\user\models\ProfileField;
use humhub\modules\user\models\ProfileFieldCategory;
use Yii;
use yii\web\Response;

class ProfileController extends Controller
{
    public $enableCsrfValidation = false;

    public $layout = false;

    private const KIND_BY_CLASS = [
        Text::class => 'text',
        TextArea::class => 'textarea',
        Number::class => 'number',
        Select::class => 'select',
        Date::class => 'date',
        DateTime::class => 'datetime',
        Birthday::class => 'birthday',
        CountrySelect::class => 'country',
        MarkdownEditor::class => 'markdown',
        Checkbox::class => 'checkbox',
        CheckboxList::class => 'checkboxList',
        UserEmail::class => 'userEmail',
        UserName::class => 'userName',
        UserMemberSince::class => 'userMemberSince',
        UserLastLogin::class => 'userLastLogin',
        UserGroupMemberships::class => 'userGroups',
        Template::class => 'template',
    ];

    private const CLASS_BY_KIND = [
        'text' => Text::class,
        'textarea' => TextArea::class,
        'number' => Number::class,
        'select' => Select::class,
        'date' => Date::class,
        'datetime' => DateTime::class,
        'birthday' => Birthday::class,
        'country' => CountrySelect::class,
        'markdown' => MarkdownEditor::class,
        'checkbox' => Checkbox::class,
        'checkboxList' => CheckboxList::class,
    ];

    private const KIND_LABELS = [
        'text' => 'Texto',
        'textarea' => 'Área de texto',
        'number' => 'Número',
        'select' => 'Lista',
        'date' => 'Data',
        'datetime' => 'Data e hora',
        'birthday' => 'Aniversário',
        'country' => 'País',
        'markdown' => 'Markdown',
        'checkbox' => 'Caixa de seleção',
        'checkboxList' => 'Lista de caixas',
        'userEmail' => 'E-mail do usuário',
        'userName' => 'Nome de usuário',
        'userMemberSince' => 'Membro desde',
        'userLastLogin' => 'Último acesso',
        'userGroups' => 'Grupos do usuário',
        'template' => 'Modelo',
        'other' => 'Outro',
    ];

    public function beforeAction($action)
    {
        BearerLogin::authenticate();
        if (BearerLogin::hasBearer()) {
            $this->enableCsrfValidation = false;
        }

        Yii::$app->response->format = Response::FORMAT_JSON;

        return parent::beforeAction($action);
    }

    public function actionIndex()
    {
        $denied = $this->requireAdmin();
        if ($denied !== null) {
            return $denied;
        }

        $categories = [];
        foreach (ProfileFieldCategory::find()->orderBy(['sort_order' => SORT_ASC, 'id' => SORT_ASC])->all() as $category) {
            $categories[] = $this->toCategory($category, true);
        }

        return [
            'categories' => $categories,
            'fieldTypes' => $this->creatableTypes(),
        ];
    }

    public function actionViewCategory()
    {
        $category = $this->loadCategory();
        if (!($category instanceof ProfileFieldCategory)) {
            return $category;
        }

        return $this->toCategory($category, true);
    }

    public function actionSaveCategory()
    {
        $denied = $this->requireAdmin();
        if ($denied !== null) {
            return $denied;
        }

        $body = Yii::$app->request->getBodyParams();
        $id = (int) ($body['id'] ?? 0);
        $category = $id > 0 ? ProfileFieldCategory::findOne(['id' => $id]) : new ProfileFieldCategory();
        if ($id > 0 && !$category) {
            return $this->fail(404, 'Categoria não encontrada.');
        }

        $category->title = trim((string) ($body['title'] ?? ''));
        $category->description = trim((string) ($body['description'] ?? ''));
        $category->sort_order = (int) ($body['sortOrder'] ?? 100);
        if ($category->isNewRecord) {
            $category->visibility = 1;
        }

        if ($category->title === '') {
            return $this->fail(400, 'Informe o nome da categoria.');
        }

        if (!$category->save()) {
            return $this->fail(400, $this->firstError($category));
        }

        return $this->toCategory(ProfileFieldCategory::findOne(['id' => $category->id]), true);
    }

    public function actionDeleteCategory()
    {
        $category = $this->loadCategory();
        if (!($category instanceof ProfileFieldCategory)) {
            return $category;
        }

        if ($category->is_system) {
            return $this->fail(400, 'Esta categoria do sistema não pode ser excluída.');
        }

        if (count($category->fields) > 0) {
            return $this->fail(400, 'Só é possível excluir categorias sem campos.');
        }

        $category->delete();

        return ['ok' => true];
    }

    public function actionViewField()
    {
        $field = $this->loadField();
        if (!($field instanceof ProfileField)) {
            return $field;
        }

        return $this->toField($field);
    }

    public function actionSaveField()
    {
        $denied = $this->requireAdmin();
        if ($denied !== null) {
            return $denied;
        }

        $body = Yii::$app->request->getBodyParams();
        $id = (int) ($body['id'] ?? 0);
        $field = $id > 0 ? ProfileField::findOne(['id' => $id]) : new ProfileField();
        if ($id > 0 && !$field) {
            return $this->fail(404, 'Campo não encontrado.');
        }

        $categoryId = (int) ($body['categoryId'] ?? $field->profile_field_category_id);
        $category = ProfileFieldCategory::findOne(['id' => $categoryId]);
        if (!$category) {
            return $this->fail(400, 'Informe uma categoria válida.');
        }

        $field->profile_field_category_id = $category->id;
        $field->title = trim((string) ($body['title'] ?? ''));
        $field->description = trim((string) ($body['description'] ?? ''));
        $field->sort_order = (int) ($body['sortOrder'] ?? 100);
        $field->required = !empty($body['isRequired']) ? 1 : 0;
        $field->visible = !empty($body['isVisible']) ? 1 : 0;
        $field->editable = !empty($body['isEditable']) ? 1 : 0;
        $field->searchable = !empty($body['isSearchable']) ? 1 : 0;
        $field->show_at_registration = !empty($body['showAtRegistration']) ? 1 : 0;

        if ($field->isNewRecord) {
            $kind = trim((string) ($body['kind'] ?? ''));
            if (!isset(self::CLASS_BY_KIND[$kind])) {
                return $this->fail(400, 'Escolha um tipo de campo válido.');
            }

            $field->internal_name = strtolower(trim((string) ($body['internalName'] ?? '')));
            $field->field_type_class = self::CLASS_BY_KIND[$kind];
        }

        if ($field->title === '') {
            return $this->fail(400, 'Informe o título do campo.');
        }

        if (!$field->save()) {
            return $this->fail(400, $this->firstError($field));
        }

        $fieldType = $field->getFieldType();
        if ($fieldType instanceof BaseType) {
            $fieldType->setProfileField($field);
            try {
                $fieldType->save();
            } catch (\Throwable $error) {
                Yii::error($error->getMessage(), 'nexchat');
                return $this->fail(400, 'Não foi possível gravar o tipo do campo.');
            }
        }

        return $this->toField(ProfileField::findOne(['id' => $field->id]));
    }

    public function actionDeleteField()
    {
        $field = $this->loadField();
        if (!($field instanceof ProfileField)) {
            return $field;
        }

        if ($field->is_system) {
            return $this->fail(400, 'Este campo do sistema não pode ser excluído.');
        }

        if (!$field->delete()) {
            return $this->fail(400, 'Não foi possível excluir o campo.');
        }

        return ['ok' => true];
    }

    private function loadCategory()
    {
        $denied = $this->requireAdmin();
        if ($denied !== null) {
            return $denied;
        }

        $id = (int) Yii::$app->request->get('id', Yii::$app->request->getBodyParams()['id'] ?? 0);
        $category = ProfileFieldCategory::findOne(['id' => $id]);
        if (!$category) {
            return $this->fail(404, 'Categoria não encontrada.');
        }

        return $category;
    }

    private function loadField()
    {
        $denied = $this->requireAdmin();
        if ($denied !== null) {
            return $denied;
        }

        $id = (int) Yii::$app->request->get('id', Yii::$app->request->getBodyParams()['id'] ?? 0);
        $field = ProfileField::findOne(['id' => $id]);
        if (!$field) {
            return $this->fail(404, 'Campo não encontrado.');
        }

        return $field;
    }

    private function toCategory(ProfileFieldCategory $category, bool $withFields): array
    {
        $payload = [
            'id' => (int) $category->id,
            'title' => $this->translated($category->getTranslationCategory(), (string) $category->title),
            'description' => $this->translated($category->getTranslationCategory(), (string) $category->description),
            'sortOrder' => (int) $category->sort_order,
            'isSystem' => (bool) $category->is_system,
            'canDelete' => !$category->is_system && count($category->fields) === 0,
            'fields' => [],
        ];

        if (!$withFields) {
            return $payload;
        }

        foreach ($category->fields as $field) {
            $payload['fields'][] = $this->toField($field);
        }

        return $payload;
    }

    private function toField(ProfileField $field): array
    {
        $kind = self::KIND_BY_CLASS[$field->field_type_class] ?? 'other';
        $type = $field->getFieldType();
        $isVirtual = $type instanceof BaseType && $type->isVirtual;

        return [
            'id' => (int) $field->id,
            'categoryId' => (int) $field->profile_field_category_id,
            'internalName' => (string) $field->internal_name,
            'title' => $this->translated($field->getTranslationCategory(), (string) $field->title),
            'description' => $this->translated($field->getTranslationCategory(), (string) $field->description),
            'kind' => $kind,
            'kindLabel' => self::KIND_LABELS[$kind] ?? self::KIND_LABELS['other'],
            'sortOrder' => (int) $field->sort_order,
            'isRequired' => (bool) $field->required,
            'isVisible' => (bool) $field->visible,
            'isEditable' => (bool) $field->editable,
            'isSearchable' => (bool) $field->searchable,
            'showAtRegistration' => (bool) $field->show_at_registration,
            'isSystem' => (bool) $field->is_system,
            'isVirtual' => $isVirtual,
            'canDelete' => !(bool) $field->is_system,
        ];
    }

    private function creatableTypes(): array
    {
        $types = [];
        foreach (self::CLASS_BY_KIND as $kind => $_class) {
            $types[] = [
                'id' => $kind,
                'label' => self::KIND_LABELS[$kind],
            ];
        }

        return $types;
    }

    private function translated(string $category, string $message): string
    {
        if ($message === '') {
            return '';
        }

        return Yii::t($category, $message);
    }

    private function firstError($model): string
    {
        $errors = $model->getFirstErrors();
        if (!$errors) {
            return 'Não foi possível salvar.';
        }

        return (string) reset($errors);
    }

    private function requireAdmin(): ?array
    {
        if (Yii::$app->user->isGuest) {
            return $this->fail(401, 'Não autenticado.');
        }

        if (!Yii::$app->user->isAdmin()) {
            return $this->fail(403, 'Você não tem permissão para acessar esta área.');
        }

        return null;
    }

    private function fail(int $status, string $message): array
    {
        Yii::$app->response->statusCode = $status;

        return ['message' => $message];
    }
}
