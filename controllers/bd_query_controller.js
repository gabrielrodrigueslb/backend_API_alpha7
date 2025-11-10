// controllers/bd_query_controller.js
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library.js';

const prismaClients = new Map();

const getClientPrisma = (clientId, databaseUrl) => {
  if (prismaClients.has(clientId)) {
    return prismaClients.get(clientId);
  }
  // console.log(`✨ Criando novo PrismaClient para: ${clientId}`);
  const newClient = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  prismaClients.set(clientId, newClient);
  return newClient;
};

const getOrcamento = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errorMessage: 'Dados da requisição inválidos.',
      errors: errors.array(),
    });
  }

  const { id: ref_id, status, orcamentoId, filial } = req.body;

  // --- TRADUÇÃO DE STATUS (A Lógica Nova) ---
  let statusLetra = status; // Valor padrão (caso já venha a letra)
  switch (status) {
    case 'Cotação/Aberto':
    case 'ABERTO': // Adicionei para compatibilidade com nossos testes
      statusLetra = 'A';
      break;
    case 'Confirmado':
      statusLetra = 'B';
      break;
    case 'Finalizado':
    case 'FECHADO': // Adicionei para compatibilidade
      statusLetra = 'C';
      break;
    case 'Cancelado':
    case 'CANCELADO': // Adicionei para compatibilidade
      statusLetra = 'D';
      break;
  }
  // ----------------------------------------

  let prisma;
  try {
    prisma = getClientPrisma(req.clientId, req.databaseUrl);
  } catch (err) {
    return next(err);
  }

  try {
    const orcamento = await prisma.orcamento.findFirst({
      where: {
        status: statusLetra, // <--- USA A LETRA TRADUZIDA AQUI
        codigo: orcamentoId,
        unidadeNegocio: {
          codigo: filial,
        },
      },
      include: {
        unidadeNegocio: { select: { codigo: true } },
        itens: { include: { embalagem: { select: { descricao: true } } } },
      },
    });

    if (!orcamento) {
      return res.status(404).json({
        errorMessage: 'Orçamento não encontrado.',
        id: ref_id,
      });
    }

    const valorTotal = orcamento.itens.reduce((soma, item) => {
      return new Decimal(soma).plus(item.valortotal);
    }, new Decimal(0));

    res.status(200).json({
      message: 'Consulta realizada com sucesso!',
      id: ref_id,
      // Você pode querer retornar o status original (por extenso) ou a letra.
      // Vou retornar a letra que veio do banco para ser fiel aos dados.
      status: orcamento.status,
      filial: orcamento.unidadeNegocio.codigo,
      id: orcamento.codigo,
      valorTotal: valorTotal,
      itens: orcamento.itens.map((item) => ({
        descricao: item.embalagem.descricao,
        quantidade: item.quantidade,
        valortotal: item.valortotal,
      })),
    });
  } catch (err) {
    console.error(`❌ Erro no getOrcamento [${req.clientId}]:`, err.message);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export { getOrcamento };