import express from 'express';
import cookieParser from 'cookie-parser';
import appRouter from './routes/app-router';
import cors from 'cors';

let app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(appRouter);

export default app;
