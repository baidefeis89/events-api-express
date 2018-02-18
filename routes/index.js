/**
 * @author Ivan Galan Pastor
 * Tratamiento de las rutas públicas
 */
const express = require('express');
const passport = require('passport');
const https = require('https');

let User = require('../models/user');
let router = express.Router();

let fs = require('fs');

router.get('/auth/token', passport.authenticate('jwt', {session: false}), (req, res) => {
    res.send({ok: true});
});

router.get('/auth/google', (req, res) => {
    https.request('https://www.googleapis.com/plus/v1/people/me?access_token='+req.header('Authorization'))
        .on('response', function(response) {
            body = '';
            response.on('data', function(chunk) {
                body += chunk;
            }).on('end', function() {
                let datos = JSON.parse(body);

                datos.avatar = new Date().getTime() + '.jpg';

                User.crearUsuarioGoogle(datos).then( resultado => {
                    res.send({ok: true, token: resultado.token});
                    if (resultado.new) guardarImagenSocial(datos.image.url, datos.avatar);
                }).catch( error => {
                    res.send({ok:false, error:error});
                });
            });
        }).end();
})
router.get('/auth/facebook', (req, res) => {
    https.request('https://graph.facebook.com/v2.11/me?fields=id,name,email,picture&access_token=' + req.header('Authorization'))
    .on('response', function(response) {
        body = '';
        response.on('data', function(chunk) {
        body += chunk
        }).on('end', function() {
            let datos = JSON.parse(body);
            datos.avatar = new Date().getTime() + '.jpg';
            User.crearUsuarioFacebook(datos).then( resultado => {
                res.send({ok:true, token:resultado.token});
                if (resultado.new) guardarImagenSocial(datos.picture.data.url, datos.avatar);
            }).catch( error => {
                res.send({ok: false, error:error});
            });
        });
    }).end(); 
})

router.post('/auth/login', (req, res) => {
    User.validarUsuario(req.body).then(
        resultado => res.send({ok: true, token: resultado}),
        error => res.send({ok: false, error: error})
    );
});

router.post('/auth/register', (req, res) => { 
    let user = req.body;

    if (!req.files && !user.avatar) 
        res.status(400).send('Avatar is required')
    else if (req.files){
        let fileName = new Date().getTime() + '.jpg';
        
        req.files.avatar.mv('./public/img/users/' + fileName, error => {
            if (error) res.status(500).send('Error uploading file') 
            user.avatar = fileName;
        });
    } else {
        user.avatar = guardarImagen(user.avatar);
    }

    User.crearUsuario(user).then(
        resultado => res.send({ok: true, result: resultado}),
        error => {
            res.send({ok: false, error: error});
            fs.unlink('./public/img/users/' + user.avatar, () => {});
        }
    );
})

module.exports = router;

function guardarImagenSocial(url, name) {
    https.request(url)
    .on('response', function(res) {
        let body = '';
        res.setEncoding('binary');
        res.on('data', function(chunk) {
            body += chunk
        }).on('end', function() {
            fs.writeFileSync('./public/img/users/' + name, body, 'binary');
        });
    })
    .end();
}

function guardarImagen(image) {
    image = image.replace(/^data:image\/png;base64,/, "");
    image = image.replace(/^data:image\/jpg;base64,/, "");
    image = image.replace(/^data:image\/jpeg;base64,/, "");
    
    image = Buffer.from(image, 'base64');
    
    let nameFile = new Date().getTime() + '.jpg';

    fs.writeFileSync('./public/img/users/' + nameFile, image);
    
    return nameFile;
}
