import { validationResult } from 'express-validator';
import { Decimal } from '@prisma/client/runtime/library.js';
import { createTenantPrisma } from '../lib/prismaTenant.js';

const getOrcamento = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errorMessage: 'Dados da requisição inválidos.',
      errors: errors.array(),
    });
  }

  const { id: ref_id, status, orcamentoId, filial } = req.body;

  let statusLetra = status;
  switch (status) {
    case 'Cotação/Aberto':
    case 'ABERTO':
      statusLetra = 'A';
      break;
    case 'Confirmado':
      statusLetra = 'B';
      break;
    case 'Finalizado':
    case 'FECHADO':
      statusLetra = 'C';
      break;
    case 'Cancelado':
    case 'CANCELADO':
      statusLetra = 'D';
      break;
  }

  let prisma;

  try {
    // ✅ AQUI ESTÁ O PONTO CRÍTICO
    prisma = createTenantPrisma(req.databaseUrl);

    const orcamento = await prisma.orcamento.findFirst({
      where: {
        status: statusLetra, // 'A', 'B', 'C'
        codigo: String(orcamentoId), // int
        unidadeNegocio: {
          codigo: String(filial),
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

    const valorTotal = orcamento.itens.reduce(
      (soma, item) => new Decimal(soma).plus(item.valortotal),
      new Decimal(0),
    );

    res.status(200).json({
      message: 'Consulta realizada com sucesso!',
      id: ref_id,
      status: orcamento.status,
      filial: orcamento.unidadeNegocio.codigo,
      id: orcamento.codigo,
      valorTotal,
      itens: orcamento.itens.map((item) => ({
        descricao: item.embalagem.descricao,
        quantidade: item.quantidade,
        valortotal: item.valortotal,
      })),
    });
  } catch (err) {
    console.error(`❌ Erro no getOrcamento [${req.clientId}]:`, err);
    next(err);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
};

export { getOrcamento };
