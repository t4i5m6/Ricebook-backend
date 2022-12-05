const mongoose = require('mongoose');
const userSchema = require('./userSchema');
const User = mongoose.model('user', userSchema);
const followingSchema = require('./followingSchema');
const Following = mongoose.model('following', followingSchema);
let jsonData = require('../connectString.json')
const connector =   mongoose.connect(jsonData.mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });


function addFollowing(req, res){
    let username = req.username
    let followerUsername = req.params.user;
    if(!followerUsername || followerUsername == username){
        return res.sendStatus(400)
    }

    (async ()=> {
        await connector.then(async () => {
            let isExist = await User.exists({username: followerUsername})
            if(!isExist) {
                return res.sendStatus(404)
            }
            let isFollowingExist = await Following.exists({username, following: followerUsername})

            if(isFollowingExist){
                return res.sendStatus(409)
            }

            await Following.findOneAndUpdate({username}, {$addToSet: {following: followerUsername}}, {upsert: true, new:true
            }).exec(function(err, items){
                let msg = {username: username, following: items['following']};
                res.send(msg);
            })

        })
    })()
}

function getFollowing(req, res){
    let username = req.username
    if(req.params.user){
        username = req.params.user
    }

    (async ()=> {
        await connector.then(async () => {
            let isExist = await User.exists({username})
            if (!isExist) {
                return res.sendStatus(404)
            }
            Following.findOne({username}).exec(function(err, items){
                let following = []
                if(items && items['following']){
                    following = items['following']
                }
                let msg = {username: username, following};
                res.send(msg);
            })
        })
    })()
}

function deleteFollowing(req, res){
    let username = req.username
    let followerUsername = req.params.user;
    if(!followerUsername){
        res.sendStatus(400)
    }

    (async ()=> {
        await connector.then(async () => {

            await Following.findOneAndUpdate({username}, {$pull: {following: followerUsername}}, {new:true
            }).exec(function(err, items){
                let msg = {username: username, following: items['following']};
                res.send(msg);
            })
        })
    })()
}





module.exports = (app) => {
    app.put('/following/:user', addFollowing);
    app.get('/following/:user?', getFollowing);
    app.delete('/following/:user', deleteFollowing);
}