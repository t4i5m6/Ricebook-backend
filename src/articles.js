const mongoose = require('mongoose');
const articleSchema = require('./articleSchema');
const Article = mongoose.model('article', articleSchema);
const userSchema = require('./userSchema');
const User = mongoose.model('user', userSchema);
const followingSchema = require('./followingSchema');
const Following = mongoose.model('following', followingSchema);
const uploadImage = require('./uploadCloudinary')
let jsonData = require('../connectString.json')


const connector =   mongoose.connect(jsonData.mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

function getArticles(req, res){
    let username = req.username
    let id = req.params.id;

    (async ()=> {
        connector.then(async () => {
            let query;
            if(!id) {
                query = await Following.aggregate([
                    {
                        $match: {
                            "username": username
                        }
                    },
                    {
                        $addFields: {
                            newFollowing: {
                                $concatArrays: [
                                    "$following",
                                    [username]
                                ]
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: "articles",
                            localField: "newFollowing",
                            foreignField: "author",
                            as: "userFeeds"
                        }

                    },
                    {
                        $project: {
                            "userFeeds": 1
                        }
                    },
                    {
                        $unwind: {
                            path: "$userFeeds"
                        }
                    },
                    {
                        $sort: {
                            "userFeeds.date": -1
                        }
                    }
                    ]
                )
                if(query){
                    let arr = []
                    for( let i = 0; i < query.length; i++){
                        arr.push(query[i]["userFeeds"])
                    }
                    query = arr
                }
            }
            else if(!isNaN(id[0])){
                query = await Article.find({pid: id})
                if(query.length == 0){
                     return res.sendStatus(404)
                }
            }
            else {
                let isUserExist = await User.exists({username:id })
                if(!isUserExist){
                    return res.sendStatus(404)
                }
                query = await Article.find({author:id })
            }
            res.send({articles: query});

        })
    })()
}

function updateArticleOrComment(req, res){
    let id = req.params.id;
    let text = req.body.text;
    let commentId = req.body.commentId;
    let username = req.username
    let goal = "udpateArticle";

    if(!text){
        return res.sendStatus(400)
    }



    if (commentId != undefined) {
        if(commentId == -1) {
            goal = "newComment"
        }
        else{
            goal = "updateComment"
        }
    }


    (async ()=> {
        connector.then(async () => {

            let articles;
            if(goal == "udpateArticle"){
                let isPidexists = await Article.exists({pid: id, author: username})
                if(!isPidexists){
                    return res.sendStatus(403)
                }
                articles = await Article.findOneAndUpdate({pid: id}, { $set: { text} }, {new: true})
            }
            else if (goal == "newComment"){
                let cur = await Article.findOne({pid: id})
                let l = cur.comments.length
                let newCommentId = l != 0 ? cur.comments[l-1].commentId + 1 : 0;
                articles= await Article.findOneAndUpdate({pid: id}, { $push: { comments: {comment: text, commentId: newCommentId, author: username}} }, {new: true})
            }
            else if (goal == "updateComment"){
                let isCidexists = await Article.exists({pid: id, "comments.author": username, "comments.commentId": commentId})
                if(!isCidexists){
                    return res.sendStatus(403)
                }
                articles= await Article.findOneAndUpdate({pid: id, "comments.commentId": commentId}, { $set: { "comments.$.comment": text }}, {new: true})
            }

            if(!articles){
                res.sendStatus(404)
            }
            else{
                let msg = {articles};
                res.send(msg);
            }
        })
    })()
}

function addArticle(req, res){
    let text = req.body.text;
    let username = req.username
    if(!text){
        return res.sendStatus(400)
    }

    (async ()=> {
        connector.then(async  () => {
            let latestArticle = await Article.find().sort({ date: -1 }).limit(1)
            let pid = latestArticle.length != 0 ? latestArticle[0].pid + 1 : 0;
            await new Article({
                pid,
                author: username,
                text,
                date: Date.now(),
                picture: req.fileurl
            }).save()
            Article.find({author: username}).exec(function(err, items){
                res.send({articles: items});
            })
        })
    })()
}


module.exports = (app) => {
    app.get('/articles/:id?', getArticles);
    app.put('/articles/:id', updateArticleOrComment);
    app.post('/article', uploadImage("articles"), addArticle);
}