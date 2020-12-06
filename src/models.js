import mongoose from 'mongoose';

mongoose.connect(
    "mongodb://localhost:27017/lr5",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
    }
);

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

const memberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    money: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
});

const shareSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        default: "Unknown",
    },
    distribution: {
        type: String,
        required: true,
    },
    dispersion: {
        type: Number,
        required: true,
        min: 0,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    count: {
        type: Number,
        required: true,
        min: 0,
    }
});

const marketSchema = new mongoose.Schema({
    start: {
        type: Date,
        required: true,
        default: new Date(Date.now())
    },
    end: {
        type: Date,
        required: true,
        default: new Date(Date.now())
    },
    recomputeDuration: {
        type: Number,
        required: true,
        min: 1,
        default: 60,
    },
});

let MemberModel = mongoose.model('member', memberSchema);
let ShareModel = mongoose.model('share', shareSchema);
let MarketModel = mongoose.model('market', marketSchema);

export default {
    Member: MemberModel,
    Share: ShareModel,
    Market: MarketModel,
}

export {
    MemberModel as Member,
    ShareModel as Share,
    MarketModel as Market,
}