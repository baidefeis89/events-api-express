/**
 * @author Ivan Galan Pastor
 * Tratamiento de las rutas relacionadas con los eventos
 */
const express = require('express');
let Event = require('../models/event');
let router = express.Router();

let fs = require('fs');



router.get('/', (req, res) => {
    Event.listarEventos(req.user.id).then( 
        resultado => Promise.all( resultado.map(e => e.getCreator()) ).then( 
            result => res.send({ok: true, events: result}), 
            error => res.send({ok: false, error: error})  
        ), 
        error => res.send({ok: false, error: error})
    )
});

router.get('/mine', (req, res) => {
    let userId = req.user.id;
    Event.listarEventosDe(userId, userId).then(
        resultado => res.send({ok: true, events: resultado}),
        error => res.send({ok: false, error: error})
    );
});

router.get('/user/:id', (req, res) => {
    let userId = req.user.id;

    Event.listarEventosDe(req.params.id, userId).then(
        resultado => res.send({ok: true, events: resultado}),
        error => res.send({ok: false, error: error})
    );
});

router.get('/attend', (req, res) => {
    Event.listarEventosAsiste(req.user.id).then( 
        resultado => Promise.all( resultado.map(e => e.getCreator()) ).then( 
            result => res.send({ok: true, events: result}), 
            error => res.send({ok: false, error: error})  
        ), 
        error => res.send({ok: false, error: error})
    )
});

router.get('/attend/:id', (req, res) => {
    Event.listarEventosAsiste(req.params.id).then( 
        resultado => Promise.all( resultado.map(e => e.getCreator()) ).then( 
            result => res.send({ok: true, events: result}), 
            error => res.send({ok: false, error: error})  
        ), 
        error => res.send({ok: false, error: error})
    )
});

router.get('/:id', (req, res) => {
    Event.getEvento(req.params.id, req.user.id).then( 
        resultado => resultado.getCreator().then( 
            result => res.send({ok: true, event: result}), 
            error => res.send({ok: false, error: error})  
        ), 
        error => res.send({ok: false, error: error})
    )
});

router.post('/', (req, res) => {

    let event = new Event(req.body);
    
    let fileName = new Date().getTime() + '.jpg';

    if (!req.files && !event.image) 
        res.status(400).send('Image is required')
    else if (req.files){

        req.files.image.mv('./public/img/events/' + fileName, error => {
            if (error) res.status(500).send('Error uploading file') 
            let event = new Event(req.body);
            event.image = fileName;
        });
    } else {
        event.image = guardarImagen(event.image);
    }

    event.creator = req.user.id;

    event.crear().then(
        resultado => res.send({ok: true, result: resultado}),
        error => {
            res.send({ok: false, error: error});
            fs.unlink('./public/img/events/' + event.image, () => {});
        }
    );
});

router.post('/attend/:id', (req, res) => {   
    let eventId = req.params.id;
    let id = req.user.id;
    let tickets = req.body.number;

    Event.attendEvent(eventId, id, tickets).then(
        resultado => res.send({ok: true, result: resultado}),
        error => res.send({ok: false, error: error})
    );
});

router.put('/:id', (req, res) => {
    let eventId = req.params.id;
    let event = req.body;
    let id = req.user.id;

    if (req.files){
        let fileName = new Date().getTime() + '.jpg';

        req.files.image.mv('./public/img/events/' + fileName, error => {
            if (error) res.status(500).send('Error uploading file') 
            let event = new Event(req.body);
            event.image = fileName;
            event.image = fileName;   
        });
    } else if (event.image){
        event.image = guardarImagen(event.image);
    }

    Event.getEvento(eventId, id).then(
        resultado => resultado.modificarEvento(id, event).then(
            result => res.send({ok: true, result: result}),
            error => res.send({ok: false, error: error})
        ),
        error => res.send({ok: false, error: error})
    );
    
});

router.delete('/:id', (req, res) => {
    let id = req.user.id;
    let eventId = req.params.id;

    Event.borrarEvento(eventId, id).then(
        resultado => res.send({ok: true, result: resultado}),
        error => res.send({ok: false, error: error})
    );
});

module.exports = router;

function guardarImagen(image) {
    image = image.replace(/^data:image\/png;base64,/, "");
    image = image.replace(/^data:image\/jpg;base64,/, "");
    image = image.replace(/^data:image\/jpeg;base64,/, "");
    
    image = Buffer.from(image, 'base64');
    
    let nameFile = new Date().getTime() + '.jpg';

    fs.writeFileSync('./public/img/events/' + nameFile, image);
    
    return nameFile;
}
