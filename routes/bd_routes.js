// routes/bd_routes.js
import express from "express";
import { body } from "express-validator";
import isAuth from "../middleware/isAuth.js";
import { getOrcamento } from "../controllers/bd_query_controller.js";

const router = express.Router();

router.post(
    "/getOrcamento",
    isAuth,
    [
        // Valida os novos campos (que antes estavam dentro do SQL)
        body("id").trim().notEmpty().withMessage("O 'id' (ref_id) é obrigatório."),
        body("status").trim().notEmpty().withMessage("O 'status' é obrigatório."),
        body("orcamentoId").trim().notEmpty().withMessage("O 'orcamentoId' é obrigatório."),
        body("filial").trim().notEmpty().withMessage("A 'filial' é obrigatória.")
    ],
    getOrcamento
);

export default router;