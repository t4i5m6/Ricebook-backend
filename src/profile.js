const mongoose = require('mongoose');
const profileSchema = require('./profileSchema');
const Profile = mongoose.model('profile', profileSchema);
let jsonData = require('../connectString.json')
const uploadImage = require('./uploadCloudinary')

const connector =   mongoose.connect(jsonData.mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

function getHeadline(req, res) {
    let username = req.username
    if (req.params.user) {
        username = req.params.user
    }
    (async ()=> {
        connector.then(async () => {
            let profile = await Profile.findOne({username}).select("headline")
            if(!profile) {
                return res.sendStatus(404)
            }
            let msg = {username: username, headline: profile["headline"]};
            res.send(msg);
        })
    })()
}


function updateHeadline(req, res) {
    let username = req.username
    let headline = req.body.headline;
    (async ()=> {
        await connector.then(async () => {
            await Profile.findOneAndUpdate({username}, { $set: { headline} })
            let msg = {username: username, headline: headline};
            res.send(msg);
        })
    })()
}

function getEmail(req, res) {
    let username = req.username
    if (req.params.user) {
        username = req.params.user
    }
    (async ()=> {
        connector.then(async () => {
            let profile = await Profile.findOne({username}).select("email")
            if(!profile) {
                return res.sendStatus(404)
            }
            let msg = {username: username, email: profile["email"]};
            res.send(msg);
        })
    })()
}

function updateEmail(req, res) {
    let username = req.username
    let email = req.body.email;
    (async ()=> {
        await connector.then(async () => {
            await Profile.findOneAndUpdate({username}, { $set: { email} })
            let msg = {username: username, email: email};
            res.send(msg);
        })
    })()
}

function getZipcode(req, res) {
    let username = req.username
    if (req.params.user) {
        username = req.params.user
    }
    (async ()=> {
        connector.then(async () => {
            let profile = await Profile.findOne({username}).select("zipcode")
            if(!profile) {
                return res.sendStatus(404)
            }
            let msg = {username: username, zipcode: profile["zipcode"]};
            res.send(msg);
        })
    })()
}

function updateZipcode(req, res) {
    let username = req.username
    let zipcode = req.body.zipcode;
    (async ()=> {
        await connector.then(async () => {
            await Profile.findOneAndUpdate({username}, { $set: { zipcode} })
            let msg = {username: username, zipcode: zipcode};
            res.send(msg);
        })
    })()
}

function getDob(req, res) {
    let username = req.username
    if (req.params.user) {
        username = req.params.user
    }
    (async ()=> {
        connector.then(async () => {
            let profile = await Profile.findOne({username}).select("dob")
            if(!profile) {
                return res.sendStatus(404)
            }
            let msg = {username: username, dob: profile["dob"]};
            res.send(msg);
        })
    })()
}

function updateAvatar(req, res) {
    let username = req.username
    let avatar = req.fileurl;

    (async ()=> {
        await connector.then(async () => {
            await Profile.findOneAndUpdate({username}, { $set: { avatar } })
            let msg = {username: username, avatar: avatar};
            res.send(msg);
        })
    })()
}

function getAvatar(req, res) {
    let username = req.username
    if (req.params.user) {
        username = req.params.user
    }
    (async ()=> {
        connector.then(async () => {
            let profile = await Profile.findOne({username}).select("avatar")
            if(!profile) {
                return res.sendStatus(404)
            }
            let msg = {username: username, avatar: profile["avatar"]};
            res.send(msg);
        })
    })()
}

module.exports = (app) => {
    app.get('/headline/:user?', getHeadline);
    app.put('/headline', updateHeadline);
    app.get('/email/:user?', getEmail);
    app.put('/email', updateEmail);
    app.get('/zipcode/:user?', getZipcode);
    app.put('/zipcode', updateZipcode);
    app.get('/dob/:user?', getDob);
    app.get('/avatar/:user?', getAvatar);
    app.put('/avatar', uploadImage('avatar'), updateAvatar)
}
