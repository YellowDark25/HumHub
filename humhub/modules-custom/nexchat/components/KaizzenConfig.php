<?php

namespace humhub\modules\nexchat\components;

use Yii;

/**
 * Lê as variáveis Kaizzen (secretária, serviço e URL do Next).
 * Consulta getenv, $_ENV e Yii params; devolve 0/string vazia quando não há valor.
 */
class KaizzenConfig
{
    public const SECRET_HEADER = 'X-Kaizzen-Secret';

    /**
     * Id legado da conta HumHub da secretária, se ainda existir.
     * Só serve para esconder essa conta das listagens; o fio novo não usa usuário.
     */
    public static function secretaryUserId(): int
    {
        return (int) self::read('KAIZZEN_SECRETARY_USER_ID', 'kaizzenSecretaryUserId');
    }

    /**
     * Segredo compartilhado entre HumHub e o Next para o cano da secretária.
     * Lê KAIZZEN_SERVICE_SECRET.
     */
    public static function serviceSecret(): string
    {
        return trim(self::read('KAIZZEN_SERVICE_SECRET', 'kaizzenServiceSecret'));
    }

    /**
     * URL pública do app Next (sem barra final).
     * Lê KAIZZEN_NEXT_URL; local padrão http://host.docker.internal:3001.
     */
    public static function nextUrl(): string
    {
        $url = trim(self::read('KAIZZEN_NEXT_URL', 'kaizzenNextUrl'));
        if ($url === '') {
            $url = 'http://host.docker.internal:3001';
        }

        return rtrim($url, '/');
    }

    /**
     * Diz se o id é o da secretária configurada.
     */
    public static function isSecretaryUser(int $userId): bool
    {
        $secretaryId = self::secretaryUserId();

        return $secretaryId > 0 && $userId === $secretaryId;
    }

    /**
     * Diz se o request traz o header do serviço.
     */
    public static function hasServiceSecretHeader(): bool
    {
        return self::requestSecret() !== '';
    }

    /**
     * Exige o segredo do serviço. Sem match, lança 403.
     */
    public static function requireServiceSecret(): void
    {
        $expected = self::serviceSecret();
        $given = self::requestSecret();
        if ($expected === '' || $given === '' || !hash_equals($expected, $given)) {
            throw new \yii\web\ForbiddenHttpException('Serviço da secretária não autorizado.');
        }
    }

    /**
     * Liga o parser JSON neste request e descarta um body já lido como POST vazio.
     * Sem o reset, getBodyParams devolve [] e a resposta da secretária cai em 400.
     */
    public static function enableJsonParser(): void
    {
        Yii::$app->request->parsers['application/json'] = \yii\web\JsonParser::class;
        Yii::$app->request->setBodyParams(null);
    }

    /**
     * Lê o segredo do request: header próprio, Authorization Bearer ou CGI.
     */
    private static function requestSecret(): string
    {
        $headers = Yii::$app->request->headers;
        $direct = trim((string) $headers->get(self::SECRET_HEADER, ''));
        if ($direct !== '') {
            return $direct;
        }

        $authorization = trim((string) $headers->get('Authorization', ''));
        if (stripos($authorization, 'Bearer ') === 0) {
            return trim(substr($authorization, 7));
        }

        $cgi = $_SERVER['HTTP_X_KAIZZEN_SECRET'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $cgi = trim((string) $cgi);
        if (stripos($cgi, 'Bearer ') === 0) {
            return trim(substr($cgi, 7));
        }

        return $cgi;
    }

    private static function read(string $envName, string $paramName): string
    {
        $fromEnv = getenv($envName);
        if (is_string($fromEnv) && $fromEnv !== '') {
            return $fromEnv;
        }

        $fromServer = $_ENV[$envName] ?? $_SERVER[$envName] ?? null;
        if (is_string($fromServer) && $fromServer !== '') {
            return $fromServer;
        }

        $fromParams = Yii::$app->params[$paramName] ?? null;
        if (is_string($fromParams) || is_int($fromParams)) {
            return (string) $fromParams;
        }

        return '';
    }
}
