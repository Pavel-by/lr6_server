import {Share} from '../models';
import express from 'express';

let router = express.Router();

router.get('/share/all', async (req, res) => {
    let shares = await Share.find();
    res.send(shares);
    console.log(`GET ${req.url}: ${JSON.stringify(shares)}`);
});

router.put('/share', async (req, res) => {
    let share = new Share(req.body);
    share._id = undefined;
    share.save(async function (error) {
        if (error) {
            res.status(400);
            res.send(error);
            console.log(`PUT ${req.url}: ${error}`);
        } else {
            console.log(`PUT ${req.url}: ${JSON.stringify(share)} success`);
            res.send(await Share.find());
        }
    });
});

router.put('/share/:shareId', async (req, res) => {
    let share = new Share(req.body);
    share._id = req.params.shareId;

    let error;
    try {
        await share.validate();
        await Share.updateOne({_id: share._id}, share);
    } catch (e) {
        error = e;
    }

    if (error) {
        res.status(400);
        res.send(error);
        console.log(`PUT ${req.url}: ${error}`);
    } else {
        res.send(await Share.find());
        console.log(`PUT ${req.url}: ${JSON.stringify(share)}`);
    }
});

router.delete('/share/:shareId', async (req, res) => {
     try {
         await Share.deleteOne({_id: req.params.shareId});
     } catch (e) {
         console.log(`DELETE ${req.url}: error ${e}`);
     }

     res.send(await Share.find());
});

export default router;