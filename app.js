// app.js (Corrigido)
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import bdRoutes from "./routes/bd_routes.js";
import adminRoutes from "./routes/admin_routes.js";

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET", "POST");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );
    next();
});

app.use('/bd', bdRoutes);
app.use('/admin', adminRoutes);

app.use((error, req, res, next) => {
    console.log(error.statusCode + '-' + error.message);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message;
    res.status(statusCode).json({ errorMessage: errorMessage });
});

const PORT = process.env.PORT || 40780;

console.log(`App online (ESM + Prisma) na porta ${PORT}`);
app.listen(PORT);