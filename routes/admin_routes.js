// routes/admin_routes.js
import express from 'express';
import { body } from 'express-validator';
import { createClient } from '../controllers/admin_controller.js';

const router = express.Router();

// Middleware simples para proteger a rota admin com uma chave mestre
const isAdmin = (req, res, next) => {
    const adminKey = req.get('X-Admin-Key');
    // Defina uma chave forte no seu .env, ex: ADMIN_SECRET=MinhaSenhaSuperSecreta123
    if (adminKey === process.env.ADMIN_SECRET) {
        next();
    } else {
        res.status(403).json({ errorMessage: "Acesso administrativo negado." });
    }
};

router.post(
    '/createClient',
    isAdmin, // Protege a rota
    [
        body('apiKey').trim().notEmpty().withMessage('API Key é obrigatória.'),
        body('clientName').trim().notEmpty().withMessage('Nome do cliente é obrigatório.'),
        body('dbHost').trim().notEmpty().withMessage('Host do banco é obrigatório.'),
        body('dbUser').trim().notEmpty().withMessage('Usuário do banco é obrigatório.'),
        body('dbPass').trim().notEmpty().withMessage('Senha do banco é obrigatória.'),
        body('dbName').trim().notEmpty().withMessage('Nome do banco é obrigatório.')
    ],
    createClient
);

export default router;