const express = require('express');
const cors = require('cors');
const passport = require('passport');
const {Strategy, ExtractJwt} = require('passport-jwt');
const jwt = require('jsonwebtoken');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');

const index = require('./routes/index');
const events = require('./routes/events');
const users = require('./routes/users');

const secreto = 'DespliegueNode';


passport.use(new Strategy({secretOrKey: secreto, jwtFromRequest:
            ExtractJwt.fromAuthHeader()}, (payload, done) => {
    if (payload.id) {
        return done(null, {id: payload.id});
    } else {
        return done(new Error("Usuario incorrecto"), null);
    }
}));

let app = express();

app.use(passport.initialize());

app.use(fileUpload());
app.use(bodyParser.json());

app.use(cors());

app.use(express.static(__dirname + '/public'));

app.use('/', index);
app.use('/events', passport.authenticate('jwt', {session: false}), events);
app.use('/users', passport.authenticate('jwt', {session: false}), users);

app.use( (req, res, next) => {
    res.status(404);
    res.send({ ok:false, error: 'uri not found' });
});

app.listen(8080);
