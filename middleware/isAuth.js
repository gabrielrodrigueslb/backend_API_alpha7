// middleware/isAuth.js
import pg from 'pg';
import NodeCache from 'node-cache';

// Cache por 10 minutos (600 segundos)
const authCache = new NodeCache({ stdTTL: 600 });

// Conecta no SEU cofre (Master DB)
const masterPool = new pg.Pool({
  connectionString: process.env.MASTER_DATABASE_URL,
});

// --- FUNÇÕES AUXILIARES (ADICIONE ISTO) ---

// Helper para "escapar" caracteres na senha para a URL
const encode = (val) => encodeURIComponent(val)
                            .replace(/#/g, '%23')
                            .replace(/@/g, '%40');

// Helper para montar a URL do banco
const buildDatabaseUrl = (clientData) => {
  const { db_user, db_pass, db_host, db_port, db_name } = clientData;
  // Garante que a senha está codificada para a URL
  const safePassword = encode(db_pass);
  // Garante que db_port tenha um valor padrão se vier nulo do banco
  const port = db_port || 5432;

  return `postgresql://${db_user}:${safePassword}@${db_host}:${port}/${db_name}`;
};
// ------------------------------------------

export default async (req, res, next) => {
  try {
    const apiKey = req.get('Authorization');
    if (!apiKey) throw new Error('API Key não fornecida.');

    // 1. Tenta pegar do CACHE primeiro
    let clientData = authCache.get(apiKey);

    if (clientData) {
      console.log(`⚡ Cache hit: ${clientData.clientId}`);
      req.clientId = clientData.clientId;
      req.databaseUrl = clientData.databaseUrl;
      return next();
    }

    // 2. Se não está no cache, vai no Banco Master
    console.log('🔍 Cache miss. Buscando no Master DB...');
    const result = await masterPool.query(
      'SELECT * FROM alpha7.clients WHERE api_key = $1',
      [apiKey]
    );

    if (result.rows.length === 0) throw new Error('API Key inválida.');

    const client = result.rows[0];

    // 3. Monta os dados usando a função auxiliar
    const databaseUrl = buildDatabaseUrl(client);

    clientData = {
      clientId: client.client_name,
      databaseUrl: databaseUrl,
    };

    // 4. Salva no cache para as próximas vezes
    authCache.set(apiKey, clientData);

    req.clientId = clientData.clientId;
    req.databaseUrl = clientData.databaseUrl;
    next();
  } catch (err) {
    console.error('🚨 ERRO REAL NO ISAUTH:', err);
    res.status(401).json({ errorMessage: err.message || 'Erro de autenticação' });
  }
};