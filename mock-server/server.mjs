/**
 * Mock de la API de autenticación de TheCoffeeTaster.
 *
 * Implementa el contrato definido en `src/app/core/api/auth-api.ts` para
 * poder desarrollar y probar el frontend sin backend.
 *
 *   POST /api/auth/login    → { user, accessToken } + cookie httpOnly | 401 | 429
 *   POST /api/auth/refresh  → { user, accessToken } + cookie httpOnly | 401
 *   POST /api/auth/logout   → 204 (invalida el refresh token)
 *   GET  /api/auth/me       → { user } | 401
 *   GET  /api/health        → { status: 'ok' }
 *
 * Reglas implementadas (RN-05, RN-06, RN-08):
 * - Mensaje genérico ante credenciales incorrectas (no revela si el email existe).
 * - Bloqueo de 15 minutos tras 5 intentos fallidos consecutivos, por
 *   identificador y por IP.
 * - Refresh token en cookie httpOnly con ventana deslizante de 7 días: cada
 *   refresco reinicia la ventana.
 */

import { createServer } from 'node:http';
import { randomUUID, timingSafeEqual } from 'node:crypto';

const PORT = Number(process.env.MOCK_API_PORT ?? 3000);
const HOST = process.env.MOCK_API_HOST ?? '127.0.0.1';

/** Ventana deslizante de la sesión de refresco, en días (RN-06). */
const REFRESH_WINDOW_DAYS = 7;
/** Intentos fallidos consecutivos que provocan el bloqueo por identificador (RN-05). */
const MAX_FAILED_ATTEMPTS = 5;
/**
 * Intentos fallidos que provocan el bloqueo por IP. Es un umbral más alto
 * que el del identificador: actúa como red de seguridad contra fuerza bruta
 * sin bloquear a usuarios legítimos que comparten IP (S-03).
 */
const MAX_FAILED_ATTEMPTS_BY_IP = 20;
/** Duración del bloqueo temporal, en minutos (RN-05). */
const LOCK_DURATION_MINUTES = 15;
/** Vigencia del access token (S-05). */
const ACCESS_TOKEN_TTL_MINUTES = 15;

/**
 * Usuarios seed del entorno de desarrollo.
 * En producción las cuentas se crean por un proceso manual (S-01).
 */
const USERS = [
  {
    id: 'usr_1',
    email: 'autor@thecoffeetaster.com',
    name: 'Iván Carvajal',
    password: 'Cafe#Segur0!2026',
  },
  {
    id: 'usr_2',
    email: 'editor@thecoffeetaster.com',
    name: 'Editor de prueba',
    password: 'Prensa#Cafe2026!',
  },
];

/** @type {Map<string, { userId: string, issuedAt: number }>} */
const refreshTokens = new Map();
/** @type {Map<string, number>} Identificador → instante del último fallo. */
const failedAttempts = new Map();
/** @type {Map<string, number>} Identificador o IP → instante hasta el que está bloqueado. */
const locks = new Map();

/** Compara dos cadenas en tiempo constante. */
function safeEqual(a, b) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
}

function parseCookies(header = '') {
  const cookies = {};
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    const index = trimmed.indexOf('=');
    if (index === -1) {
      continue;
    }
    cookies[trimmed.slice(0, index)] = decodeURIComponent(trimmed.slice(index + 1));
  }
  return cookies;
}

function findUser(email) {
  const normalized = String(email ?? '').trim().toLowerCase();
  return USERS.find((user) => user.email === normalized);
}

/** Minutos restantes de bloqueo para una clave, o `null` si no está bloqueada. */
function lockMinutesRemaining(key) {
  const until = locks.get(key);
  if (!until) {
    return null;
  }
  const remaining = until - Date.now();
  if (remaining <= 0) {
    locks.delete(key);
    failedAttempts.delete(key);
    return null;
  }
  return Math.ceil(remaining / 60000);
}

/**
 * Registra un intento fallido y bloquea si se supera el límite (RN-05).
 *
 * @param {string} key Clave del contador (identificador o IP).
 * @param {number} limit Intentos fallos que provocan el bloqueo.
 * @returns {number|null} Minutos de bloqueo, o `null` si no se bloquea.
 */
function registerFailure(key, limit) {
  const attempts = (failedAttempts.get(key) ?? 0) + 1;
  failedAttempts.set(key, attempts);

  if (attempts >= limit) {
    locks.set(key, Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
    failedAttempts.delete(key);
    return LOCK_DURATION_MINUTES;
  }
  return null;
}

/** Emite un refresh token nuevo y lo devuelve como cookie httpOnly. */
function issueRefreshCookie(res, userId) {
  const token = randomUUID();
  refreshTokens.set(token, { userId, issuedAt: Date.now() });

  const maxAge = Math.floor((REFRESH_WINDOW_DAYS * 24 * 60 * 60) / 1000);
  res.setHeader(
    'Set-Cookie',
    [
      `tct_refresh=${token}`,
      'HttpOnly',
      'Path=/api/auth',
      'SameSite=Strict',
      `Max-Age=${maxAge}`,
    ].join('; '),
  );
  return token;
}

/** Envuelve la respuesta en JSON. */
function sendJson(res, status, body, headers = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    ...headers,
  });
  res.end(payload);
}

/** CORS abierto para desarrollo local. */
function corsHeaders(req) {
  return {
    'Access-Control-Allow-Origin': req.headers.origin ?? '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name };
}

const server = createServer((req, res) => {
  const cors = corsHeaders(req);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const path = url.pathname;

  if (path === '/api/health') {
    sendJson(res, 200, { status: 'ok', service: 'thecoffeetaster-auth-mock' }, cors);
    return;
  }

  if (!path.startsWith('/api/auth/')) {
    sendJson(res, 404, { error: 'not_found' }, cors);
    return;
  }

  const cookies = parseCookies(req.headers.cookie);
  const refreshToken = cookies['tct_refresh'];
  const session = refreshToken ? refreshTokens.get(refreshToken) : undefined;
  const ip = req.socket.remoteAddress ?? 'unknown';

  // --- Refresh ---
  if (path === '/api/auth/refresh' && req.method === 'POST') {
    const windowMs = REFRESH_WINDOW_DAYS * 24 * 60 * 60 * 1000;

    if (!session || Date.now() - session.issuedAt > windowMs) {
      if (session) {
        refreshTokens.delete(refreshToken);
      }
      sendJson(res, 401, { code: 'invalid_refresh' }, cors);
      return;
    }

    const user = USERS.find((candidate) => candidate.id === session.userId);
    if (!user) {
      sendJson(res, 401, { code: 'invalid_refresh' }, cors);
      return;
    }

    // Ventana deslizante: cada refresco reinicia los 7 días.
    issueRefreshCookie(res, user.id);
    sendJson(
      res,
      200,
      { user: publicUser(user), accessToken: randomUUID() },
      cors,
    );
    return;
  }

  // --- Logout ---
  if (path === '/api/auth/logout' && req.method === 'POST') {
    if (refreshToken) {
      refreshTokens.delete(refreshToken);
    }
    res.writeHead(204, {
      ...cors,
      'Set-Cookie': 'tct_refresh=; HttpOnly; Path=/api/auth; SameSite=Strict; Max-Age=0',
    });
    res.end();
    return;
  }

  // --- Sesión actual ---
  if (path === '/api/auth/me' && req.method === 'GET') {
    const windowMs = REFRESH_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    if (!session || Date.now() - session.issuedAt > windowMs) {
      sendJson(res, 401, { code: 'invalid_session' }, cors);
      return;
    }
    const user = USERS.find((candidate) => candidate.id === session.userId);
    if (!user) {
      sendJson(res, 401, { code: 'invalid_session' }, cors);
      return;
    }
    sendJson(res, 200, { user: publicUser(user) }, cors);
    return;
  }

  // --- Login ---
  if (path === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      let payload = {};
      try {
        payload = JSON.parse(body || '{}');
      } catch {
        sendJson(res, 400, { code: 'invalid_body' }, cors);
        return;
      }

      const email = String(payload.email ?? '').trim().toLowerCase();
      const password = String(payload.password ?? '');
      const identifier = email || 'desconocido';

      // El bloqueo se aplica al identificador introducido (exista o no la
      // cuenta) y a la IP, para no revelar información de cuentas (S-03).
      const identifierLock = lockMinutesRemaining(identifier);
      const ipLock = lockMinutesRemaining(ip);

      if (identifierLock !== null || ipLock !== null) {
        sendJson(
          res,
          429,
          {
            code: 'account_locked',
            minutesRemaining: identifierLock ?? ipLock,
          },
          cors,
        );
        return;
      }

      const user = findUser(email);
      const passwordMatches = user ? safeEqual(user.password, password) : false;

      if (!user || !passwordMatches) {
        const locked = registerFailure(identifier, MAX_FAILED_ATTEMPTS);
        registerFailure(ip, MAX_FAILED_ATTEMPTS_BY_IP);

        if (locked !== null) {
          sendJson(res, 429, { code: 'account_locked', minutesRemaining: locked }, cors);
          return;
        }

        // Mensaje genérico: no revela si el email está registrado (RN-04).
        sendJson(res, 401, { code: 'invalid_credentials' }, cors);
        return;
      }

      failedAttempts.delete(identifier);
      failedAttempts.delete(ip);
      locks.delete(identifier);
      locks.delete(ip);

      issueRefreshCookie(res, user.id);
      sendJson(
        res,
        200,
        { user: publicUser(user), accessToken: randomUUID() },
        cors,
      );
    });
    return;
  }

  sendJson(res, 404, { error: 'not_found' }, cors);
});

server.listen(PORT, HOST, () => {
  console.log(`[mock-api] Autenticación mock en http://${HOST}:${PORT}`);
  console.log(`[mock-api] Ventana de refresco: ${REFRESH_WINDOW_DAYS} días (deslizante)`);
  console.log(`[mock-api] Bloqueo: ${MAX_FAILED_ATTEMPTS} intentos fallidos → ${LOCK_DURATION_MINUTES} min`);
  for (const user of USERS) {
    console.log(`[mock-api]   usuario seed → ${user.email} / ${user.password}`);
  }
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
