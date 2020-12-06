import express from 'express';
import {Market} from '../models';

async function instantiateMarketIfNeed(): Promise<Market> {
    let market = await Market.findOne();

    if (market)
        return market;

    market = new Market();
    let error = await market.save();

    if (error) {
        console.error(`cannot initialize Market with ${error}`);
        process.exit(1);
        return null;
    }

    return market;
}

let router = new express.Router();

router.get('/market', async (req, res) => {
    let market = await instantiateMarketIfNeed();
    res.send(market);
    console.log(`GET ${req.url}: ${market}`);
});

router.put('/market', async (req, res) => {
    let currentMarket = await instantiateMarketIfNeed();
    let market = new Market(req.body);
    market._id = currentMarket._id;
    let error;

    try {
        await market.validate();
        await Market.updateOne({}, market);
    } catch (e) {
        error = e;
    }

    if (error) {
        res.status(400);
        res.send(error);
        console.log(`PUT ${req.url}: ${error}`);
    } else {
        res.send(market);
        console.log(`PUT ${req.url}: ${market}`);
    }
});

export default router;