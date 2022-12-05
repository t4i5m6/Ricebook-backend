const auth = require('./src/auth');
const articles = require('./src/articles');
const profile = require('./src/profile');
const following= require('./src/following');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');





const hello = (req, res) => res.send({ hello: 'world' });


const app = express();
const corsOption = {origin: "https://tc78-ricebook-final.surge.sh", credentials: true};
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors(corsOption));
app.get('/', hello);

auth(app);
following(app);
articles(app);
profile(app);


// Get the port from the environment, i.e., Heroku sets it
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
     const addr = server.address();
     console.log(`Server listening at http://${addr.address}:${addr.port}`)
});
