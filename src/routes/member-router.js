import {Member} from '../models';
import express from 'express';

let router = express.Router();

router.get('/member/all', async (req, res) => {
    let members = await Member.find();
    res.send(members);
    console.log(`GET ${req.url}: send ${JSON.stringify(members)}`);
});

router.get('/member/:memberId', async (req, res) => {
    let member = await Member.findOne({_id: req.params.memberId});

    if (!member)
        res.sendStatus(404);
    else
        res.send(await Member.find());

    console.log(`GET ${req.url}: send members`);
});

router.put('/member', async (req, res) => {
    let member = new Member(req.body);
    member._id = undefined;
    member.save(async (error) => {
        if (error) {
            res.status(400);
            res.send(error);
            console.log(`PUT ${req.url}: error ${error}; receive ${req.body}, send 400`);
        } else {
            res.send(await Member.find());
            console.log(`PUT ${req.url}: receive ${req.body}, send members`);
        }
    });
});

router.put('/member/:memberId', async (req, res) => {
    let member = new Member(req.body);
    member._id = req.params.memberId;

    let error;

    try {
        await member.validate();
        await Member.updateOne({_id: member._id}, member);
    } catch (e) {
        error = e;
    }

    if (error) {
        res.status(400);
        res.send(error);
        console.log(`PUT ${req.url}: ${error}`);
    } else {
        res.send(await Member.find());
        console.log(`PUT ${req.url}: send members`);
    }
});

router.delete('/member/:memberId', async (req, res) => {
    console.log(`DELETE ${req.url}`);
    Member.deleteOne({_id: req.params.memberId}, async function () {
        res.send(await Member.find());
    });
});

export default router;