import express from 'express';
import memberRouter from './member-router';
import shareRouter from './share-router';
import marketRouter from './market-router';

let router = express.Router();

router.use(memberRouter);
router.use(shareRouter);
router.use(marketRouter);

export default router;