import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { pool } from './lib/db.js';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev', { stream: { write: (message) => logger.http(message.trim()) } }));

app.get('/health', (req, res) => {
    res.json({ success: true, data: { status: 'ok' }, message: null });
});

app.use(routes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.APP_PORT, () => {
    logger.info(`서버가 포트 ${env.APP_PORT}에서 실행 중입니다.`);
});

function shutdown(signal) {
    logger.info(`${signal} 수신 — 서버를 종료합니다.`);
    server.close(async () => {
        await pool.end();
        process.exit(0);
    });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
