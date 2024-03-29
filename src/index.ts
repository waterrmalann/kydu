import http from 'http';
import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Router as expressRouter } from 'express';
import morgan from 'morgan';

import authRouter from './routers/authRouter.js';
import gigRouter from './routers/gigRouter.js';
import chatRouter from './routers/chatRouter.js';

import admin from 'firebase-admin';
import { configSocket } from './shared/socket.js';
import { errorMiddleware } from './middlewares/errorHandler.js';

// Inject the `.env` file into `process.env`
dotenv.config();

// Initialize Firebase
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID as string,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY as string)?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL as string
});

// Connect with the database.
mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log("[database] A connection has been established with MongoDB."))
    .catch(err => {
        console.error("[database] A connection could not be established.");
        console.error(err);
        process.exit(1);
    });

const app = express();

const server = http.createServer(app);
configSocket(server);

app.disable('x-powered-by');
if (process.env.NODE_ENV as string === 'development') {
    app.use(morgan('dev'))
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.get('/', async (_req: Request, res: Response) => {
    res.status(200).send({ status: "API is online." });
});

app.use("/api/", authRouter as expressRouter);
app.use("/api/gigs", gigRouter as expressRouter);
app.use("/api/chats", chatRouter as expressRouter);

// Handle our 404.
app.get('*', (_req: Request, res: Response) => res.sendStatus(404));

app.use(errorMiddleware);

const PORT: number = parseInt(process.env.PORT as string, 10) || 3000;
server.listen(PORT, () => {
    console.log(" ██╗  ██╗██╗   ██╗██████╗ ██╗   ██╗");
    console.log(" ██║ ██╔╝╚██╗ ██╔╝██╔══██╗██║   ██║");
    console.log(" █████╔╝  ╚████╔╝ ██║  ██║██║   ██║");
    console.log(" ██╔═██╗   ╚██╔╝  ██║  ██║██║   ██║");
    console.log(" ██║  ██╗   ██║   ██████╔╝╚██████╔╝");
    console.log(" ╚═╝  ╚═╝   ╚═╝   ╚═════╝  ╚═════╝ ");
    console.log(`[server] ⚡ Server has started listening on http://localhost:${PORT}`);
});