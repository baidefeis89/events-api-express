/**
 * @author Ivan Galan Pastor
 * Clase Event y métodos relacionados con ella
 */
const conexion = require('./bdconfig');

module.exports = class Event {
    constructor(eventJson) {
        this.id = eventJson.id,
        this.creator = eventJson.creator
        this.title = eventJson.title,
        this.description = eventJson.description,
        this.date = eventJson.date,
        this.price = eventJson.price,
        this.lat = eventJson.lat,
        this.lng = eventJson.lng,
        this.address = eventJson.address,
        this.image = eventJson.image,
        this.numAttend = eventJson.numAttend,
        this.distance = eventJson.distance,
        this.mine = eventJson.mine,
        this.attend = eventJson.attend
    }

    crear() {
        return new Promise( (resolve, reject) => {
            if(!this.title) return reject('Title is required');
            if(!this.description) return reject('Description is required');
            if(!this.date) return reject('Date is required');
            if(!this.price) return reject('Price is required');
            if(!this.lat || !this.lng) return reject('Coordinates is required');
            if(!this.address) return reject('Address is required');

            let evento = {
                creator: this.creator,
                title: this.title,
                description: this.description,
                date: this.date,
                price: this.price,
                lat: this.lat,
                lng: this.lng,
                address: this.address,
                image: this.image
            };
            conexion.query('INSERT INTO event SET ?', evento, (error, resultado, campos) => {
                if (error) {
                    console.log(error);
                    return reject('Can not create event');
                }
                resolve(resultado.insertId);
            });
        });
    }

    static listarEventos(idUser) {
        return new Promise( (resolve, reject) => {
            conexion.query('SELECT event.*, haversine(user.lat, user.lng, event.lat, event.lng) as distance, ' + 
                                '(SELECT COUNT(*) FROM user_attend_event ' + 
                                'WHERE event.id = user_attend_event.event AND user_attend_event.user = ' + idUser + ') as attend ' +
                            'FROM event, user WHERE user.id = ' + idUser + ' GROUP BY event.id', (error, resultado, campos) => {
                if (error) return reject('Can not get events');
                resolve(resultado.map( e => {
                    e.mine = e.creator == idUser;
                    e.attend = e.attend == 1;
                    return new Event(e);
                }));
            });
        });
    }

    getCreator() {
        return new Promise( (resolve, reject) => {
            conexion.query('SELECT id, name, email, avatar FROM user WHERE id=' + this.creator + ' GROUP BY id', (error, resultado, campos) => {
                if (error) return reject('Can not get creator information');
                this.creator = {};
                this.creator.id = resultado[0].id;
                this.creator.name = resultado[0].name;
                this.creator.email = resultado[0].email;
                this.creator.avatar = resultado[0].avatar;
                resolve(this);
            });
        });
    
    }

    static listarEventosDe(idUser, idUserPeticion) {
        return new Promise( (resolve, reject) => {
            conexion.query('SELECT event.*, haversine(user.lat, user.lng, event.lat, event.lng) as distance, ' + 
                                '(SELECT COUNT(*) FROM user_attend_event ' + 
                                'WHERE event.id = user_attend_event.event AND user_attend_event.user = ' + idUser + ') as attend ' +
                            'FROM event, user WHERE event.creator=' + idUser + ' AND user.id = ' + idUser + ' GROUP BY event.id', (error, resultado, campos) => {
                if (error) return reject('Can not get events');
                resolve(resultado.map( e => {
                    e.mine = e.creator == idUserPeticion;
                    e.attend = e.attend == 1;
                    return new Event(e);
                }));
            });
        });
    }

    static listarEventosAsiste(idUser) {
        return new Promise( (resolve, reject) => {
            conexion.query('SELECT event.*, haversine(user.lat, user.lng, event.lat, event.lng) as distance ' + 
                            'FROM event, user WHERE event.id IN (SELECT event FROM user_attend_event WHERE user=' + idUser + ') AND user.id=' + idUser + ' GROUP BY event.id', (error, resultado, campos) => {
                if (error) return reject('Can not get events attend');
                resolve(resultado.map( e => {
                    e.mine = e.creator == idUser;
                    e.attend = true;
                    return new Event(e);
                }));
            });
        });
    }

    static getEvento(idEvento, idUser) {
        return new Promise( (resolve, reject) => {
            conexion.query('SELECT event.*, haversine(user.lat, user.lng, event.lat, event.lng) as distance, ' + 
                                '(SELECT COUNT(*) FROM user_attend_event ' + 
                                'WHERE event.id = user_attend_event.event AND user_attend_event.user = ' + idUser + ') as attend ' +
                            'FROM event, user WHERE event.id="' + idEvento + '" AND user.id = "' +  idUser + '" GROUP BY event.id', (error, resultado, campos) => {
                if (error) return reject('Can not get event');
                if(resultado.length == 0) return reject('This event does not exit');
                let evento = new Event(resultado[0]);
                evento.mine = evento.creator == idUser;
                evento.attend = evento.attend == 1;
                resolve(evento);
            });
        });
    }

    modificarEvento(idUser, evento) {
        let data = {
            title: evento.title,
            description: evento.description,
            date: evento.date,
            price: evento.price,
            lat: evento.lat,
            lng: evento.lng,
            address: evento.address
        }

        if (evento.image) data.image = evento.image;

        return new Promise( (resolve, reject) => {
            conexion.query(`UPDATE event SET ? WHERE id = ${this.id} AND creator = ${idUser}`, data, (error, resultado, campos) => {
                if (error) return reject('Event can not be modified');
                if (resultado.affectedRows < 1) return reject('you can not edit this event');
                resolve('Event has been updated');
            });
        });
    }

    static borrarEvento(idEvento, idUser) {
        return new Promise( (resolve, reject) => {
            conexion.query(`DELETE FROM event WHERE id = ${idEvento} AND creator = ${idUser}`, (error, resultado, campos) => {
                if (error) {
                    if (error.sqlState == "23000") return reject('the event can not be deleted, tickets may have been sold')
                    return reject('Can not be deleted');
                }
                if (resultado.affectedRows < 1) return reject('You can not delete this event');
                resolve('Event has been deleted');
            });
        });
    }

    static attendEvent(idEvento, idUser, tickets) {
        let data = {
            user: idUser,
            event: idEvento,
            tickets: tickets
        }
        return new Promise( (resolve, reject) => {
            conexion.query('INSERT INTO user_attend_event SET ?', data, (error, resultado, campos) => {
                if (error) {
                    console.log(error);
                    return reject('Can not attend event');
                }
                if (resultado.affectedRows < 1) return reject('Error')
                resolve('Attend saved');
            });
        });
    }
}
