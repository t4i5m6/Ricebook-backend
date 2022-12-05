const md5 = require('md5')
const mongoose = require('mongoose');
const userSchema = require('./userSchema');
const profileSchema = require('./profileSchema');
const User = mongoose.model('user', userSchema);
const Profile = mongoose.model('profile', profileSchema);
const followingSchema = require('./followingSchema');
const Following = mongoose.model('following', followingSchema);
const articleSchema = require('./articleSchema');
const Article = mongoose.model('article', articleSchema);
let jsonData = require('../connectString.json')
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;

let sessionUser = {};
let cookieKey = "sid";
let mySecretMessage = "tttt7777";


const connector =  mongoose.connect(jsonData.mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

function getOauth(req, res) {
    let username = req.username;
    (async ()=> {
        let user = await connector.then(async () => {
            return User.findOne({username})
        })
        let msg = {oauth: user.oauth, oauthUsername: user.oauthUsername};
        res.send(msg);
    })()
}

function unlinkAccount(req, res) {
    let username = req.username;
    (async ()=> {
        connector.then(async () => {
            await User.findOneAndUpdate({username}, {$set: {oauthUsername: "", oauth: ""}})
            let msg = {username: username, result: 'success'};
            return res.send(msg)
        })
    })()
}

function linkAccount(req, res) {
    let oauthUsername = req.username;
    let username = req.body.username;
    let password = req.body.password;



    // supply username and password
    if (!username || !password) {
        return res.sendStatus(400);
    }

    (async ()=> {
        connector.then(async () => {
            let isOauthUser = await User.exists({username: oauthUsername, oauth: "google", oauthUsername: ""});
            if(!isOauthUser){
                return res.sendStatus(400)
            }

            let user = await User.findOne({username});
            if (!user) {
                return res.sendStatus(401)
            }
            let hash = md5(user.salt + password);
            if (hash != user.hash) {
                return res.sendStatus(401)
            }

            if (user.oauth) {
                return res.sendStatus(409)
            }

            await Article.updateMany({author: oauthUsername}, {author: user.username});
            await Article.updateMany({}, {$set: {"comments.$[elem].author": user.username}},
                {arrayFilters: [{"elem.author": {"$eq": oauthUsername}}]});

            await Following.updateMany({"following": oauthUsername}, {$addToSet: {following: user.username}});
            await Following.updateMany({"following": oauthUsername}, {$pull: {following: oauthUsername}});

            let following = await Following.findOne({username: oauthUsername});

            let data = Object.values(following.following.filter(word => word != user.username));


            await Following.findOneAndUpdate({username:user.username},
                {$addToSet: {"following": { $each: data}}});


            await User.deleteOne({username: oauthUsername});
            await Profile.deleteOne({username: oauthUsername});
            await Following.deleteOne({username: oauthUsername});

            await User.findOneAndUpdate({username: user.username}, {$set: {oauthUsername, oauth: "google"}})
            let sid = md5(oauthUsername);

            sessionUser[sid] =  user.username;
            let msg = {username: username, result: 'success'};
            return res.send(msg)
        })
    })()

}



function isLogged(req, res) {
    /*
    if(req.isAuthenticated()){
        let username = req.user['name']
        let msg = {username: username, result: 'success'};
        return res.send(msg)
    }
    else{
        res.sendStatus(401);
    }*/
    if (!req.cookies) {
        return res.sendStatus(401);
    }

    let sid = req.cookies[cookieKey];

    // no sid for cookie key
    if (!sid) {
        return res.sendStatus(401);
    }

    let username = sessionUser[sid];

    // no username mapped to sid
    if (username) {
        let msg = {username: username, result: 'success'};
        return res.send(msg)
    }
    else {
        return res.sendStatus(401)
    }
}

function isLoggedIn(req, res, next) {
    // likely didn't install cookie parser
    /*
    if(req.isAuthenticated()){
        req.username = req.user['name'];
        next()
        return
    }*/

    if (!req.cookies) {
       return res.sendStatus(401);
    }

    let sid = req.cookies[cookieKey];

    // no sid for cookie key
    if (!sid) {
        return res.sendStatus(401);
    }

    let username = sessionUser[sid];

    // no username mapped to sid
    if (username) {
        req.username = username;
        next();
    }
    else {
        return res.sendStatus(401)
    }
}

function login(req, res) {
    let username = req.body.username;
    let password = req.body.password;

    // supply username and password
    if (!username || !password) {
        return res.sendStatus(400);
    }

    (async ()=> {
        let user = await connector.then(async () => {
            return User.findOne({ username })
        })
        if (!user) {
            return res.sendStatus(401)
        }

        let hash = md5(user.salt + password);

        if (hash === user.hash) {
            let sid = md5(username + mySecretMessage + new Date().getTime())

            sessionUser[sid] = username

            res.cookie(cookieKey, sid, { maxAge: 3600 * 1000, httpOnly: true, sameSite: 'none', secure: true});
            let msg = {username: username, result: 'success'};
            res.send(msg);
        }
        else {
            res.sendStatus(401);
        }
    })()


}

function register(req, res) {
    let username = req.body.username;
    let password = req.body.password;
    let email = req.body.email;
    let dob = req.body.dob;
    let zipcode = req.body.zipcode;

    // supply username and password
    if (!username || !password) {
        return res.sendStatus(400);
    }


     (async () => {

         let salt = username + new Date().getTime();
         let hash = md5(salt + password)
         await (connector.then(()=> {
             new User({
                 username,
                 salt,
                 hash,
                 created: Date.now()
             }).save()
                 .then(() => {
                     new Profile({
                         username,
                         email,
                         zipcode,
                         dob,
                         created: Date.now()
                     }).save()

                     new Following({
                         username
                         }
                     ).save()
                 })
                 .then(()=>{
                     let msg = {username: username, result: 'success'};
                     res.send(msg);
                 })
                 .catch(() => {
                res.sendStatus(409)
             })}));
     })();
}

function logout(req, res) {
    let sid = req.cookies[cookieKey];
    delete sessionUser[sid]
    req.logout(function(err) {
        if (err) { return next(err); }})
    res.sendStatus(200)
}

function updatePassword(req, res) {
    let username = req.username
    let password = req.body.password
    if(!password){
        return res.sendStatus(400)
    }
    (async ()=> {
        await connector.then(async () => {
            const user =  User.findOne({username}).exec(function(err, items){
                items['hash'] = md5( items['salt'] + password)
                items.save()
                let msg = {username: username, result: 'success'};
                res.send(msg);
            })
        })
    })()

}

module.exports = (app) => {

    app.use(session({
        secret: 'doNotGuessTheSecret',
        resave: true,
        saveUninitialized: true
    }));

    app.use(passport.initialize({}));
    app.use(passport.session({}));
    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(async function(user, done) {
        let userObject = await connector.then(async () => {
            return User.findOne({ $or: [{username: user['name']}, {oauthUsername: user['name']}]})
        })


        if (!userObject) {
            await new User({
                username: user['name'],
                oauth: "google",
                created: Date.now()
            }).save()
                .then(() => {
                    new Profile({
                        username: user['name'],
                        email: user['email'],
                        created: Date.now()
                    }).save()

                    new Following({
                            username: user['name']
                        }
                    ).save()
                })
            return done(null, user);
        }
        else{
            user['name'] = userObject.username;
            return done(null, user);
        }
    });
    passport.use(new GoogleStrategy({
                clientID: '688252331989-5ubo2lq2jft5g4uffqhjp3pn3sijd25h.apps.googleusercontent.com',
                clientSecret: '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',
                callbackURL: "https://tc78-ricebookserver-final.herokuapp.com/auth/google/callback",
                passReqToCallback: true
            },
            async function(req, accessToken, refreshToken, profile, done) {
                let user = {
                    'email': profile.emails[0].value,
                    'name' : profile.name.givenName + ' ' + profile.name.familyName,
                    'id'   : profile.id,
                    'token': accessToken
                };
                // You can perform any necessary actions with your user at this point,
                // e.g. internal verification against a users table,
                // creating new user entries, etc.
                done(null, user);


                // User.findOrCreate(..., function(err, user) {
                //     if (err) { return done(err); }
                //     done(null, user);
                // });
            })
    );
// Redirect the user to Google for authentication.  When complete,
// Google will redirect the user back to the application at
//     /auth/google/callback
    app.get('/auth/google', passport.authenticate('google',{ scope: ["profile", "email"], session: false})); // could have a passport auth second arg {scope: 'email'}

// Google will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
    app.get('/auth/google/callback',
        passport.authenticate('google', {failureRedirect: '/' }), async (req, res) => {
            let user = req.user;
            let userObject = await connector.then(async () => {
                return User.findOne({ $or: [{username: user['name']}, {oauthUsername: user['name']}]})
            })


            if (!userObject) {
                await new User({
                    username: user['name'],
                    oauth: "google",
                    created: Date.now()
                }).save()
                    .then(() => {
                        new Profile({
                            username: user['name'],
                            email: user['email'],
                            created: Date.now()
                        }).save()

                        new Following({
                                username: user['name']
                            }
                        ).save()
                    })
            }
            else{
                user['name'] = userObject.username;
            }

            let sid = md5(user['name'])

            sessionUser[sid] =  user['name'];
            res.cookie(cookieKey, sid, { maxAge: 3600 * 1000, httpOnly: true, sameSite: 'none', secure: true});

            return res.redirect("https://tc78-ricebook-final.surge.sh/#/login")
        });
    app.get('/islogged', isLogged);
    app.post('/login', login);
    app.post('/register', register);
    app.use(isLoggedIn);
    app.post('/link', linkAccount);
    app.put('/unlink', unlinkAccount);
    app.get('/oauth', getOauth);
    app.put('/logout', logout)
    app.put('/password', updatePassword)
}

