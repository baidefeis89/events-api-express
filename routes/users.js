/**
 * @author Ivan Galan Pastor
 * Tratamiento de las rutas relacionadas con los usuarios
 */
const express = require('express');

let User = require('../models/user');
let router = express.Router();

let fs = require('fs');


router.get('/me', (req, res) => {
    User.getUser(req.user.id).then( 
        resultado => res.send({ok: true, result: resultado}), 
        error => res.send({ok: false, error: error})
    )
});

router.get('/event/:id', (req, res) => {
    User.getUsersAttend(req.params.id).then( 
        resultado => res.send({ok: true, result: resultado}), 
        error => res.send({ok: false, error: error})
    )
});

router.get('/:id', (req, res) => {
    User.getUser(req.params.id).then( 
        resultado => res.send({ok: true, result: resultado}), 
        error => res.send({ok: false, error: error})
    )
});

router.put('/me', (req, res) => {
    User.getUser(req.user.id).then( 
        resultado => resultado.modificarEmailUser(req.body).then( 
            result => res.send({ok: true, result: result}),
            error => res.send({ok: false, error: error})
        ), 
        error => res.send({ok: false, error: error})
    )
});

router.put('/me/avatar', (req, res) => {
    let user = req.body;

    if (req.files){
        let fileName = new Date().getTime() + '.jpg';

        req.files.image.mv('./public/img/users/' + fileName, error => {
            if (error) res.status(500).send('Error uploading file') 

            user.avatar = fileName;
            user.avatar = fileName;   
        });
    } else if (user.avatar){
        user.avatar = guardarImagen(user.avatar);
    }

    User.getUser(req.user.id).then( 
        resultado => resultado.modificarAvatar(user).then( 
            result => res.send({ok: true, result: result}),
            error => res.send({ok: false, error: error})
        ), 
        error => res.send({ok: false, error: error})
    )
});

router.put('/me/password', (req, res) => {
    User.getUser(req.user.id).then(
        usuario => usuario.modificarPassword(req.body).then(
            resultado => res.send({ok: true, result: resultado}),
            error => res.send({ok: false, error: error})
        )
    );
});

module.exports = router;

function guardarImagen(image) {
    image = image.replace(/^data:image\/png;base64,/, "");
    image = image.replace(/^data:image\/jpg;base64,/, "");
    image = image.replace(/^data:image\/jpeg;base64,/, "");
    
    image = Buffer.from(image, 'base64');
    
    let nameFile = new Date().getTime() + '.jpg';

    fs.writeFileSync('./public/img/users/' + nameFile, image);
    
    return nameFile;
}
