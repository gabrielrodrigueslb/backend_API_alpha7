// controllers/admin_controller.js
import { validationResult } from 'express-validator';
// ⚠️ IMPORTANTE: Importamos do local personalizado que definimos no master.prisma
import { PrismaClient as MasterPrismaClient } from '@prisma/master-client';

// Instancia o cliente dedicado ao Master
const masterPrisma = new MasterPrismaClient();

const createClient = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errorMessage: "Dados inválidos.", errors: errors.array() });
    }

    const { apiKey, clientName, dbHost, dbPort, dbUser, dbPass, dbName } = req.body;

    try {
        // --- CRIAÇÃO COM PRISMA ---
        const newClient = await masterPrisma.client.create({
            data: {
                apiKey: apiKey,
                clientName: clientName,
                dbHost: dbHost,
                dbPort: dbPort || 5432,
                dbUser: dbUser,
                dbPass: dbPass,
                dbName: dbName
            }
        });
        // ---------------------------

        console.log(`🆕 Cliente criado: ${newClient.clientName} (ID: ${newClient.id})`);
        res.status(201).json({
            message: "Cliente cadastrado com sucesso!",
            client: {
                id: newClient.id,
                clientName: newClient.clientName,
                apiKey: newClient.apiKey
            }
        });

    } catch (err) {
        console.error("❌ Erro ao criar cliente:", err.message);
        // O código de erro do Prisma para violação de unique (P2002) é diferente do pg
        if (err.code === 'P2002') {
            return res.status(409).json({ errorMessage: "Já existe um cliente com esta API Key." });
        }
        next(err);
    }
};

export { createClient };