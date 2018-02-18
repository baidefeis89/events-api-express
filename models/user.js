/**
 * @author Ivan Galan Pastor
 * Clase User y métodos relacionados con ella
 */
const conexion = require('./bdconfig');
const jwt = require('jsonwebtoken');
const md5 = require('md5');

const secreto = 'DespliegueNode';

module.exports = class User {
    constructor(userJson) {
        this.id = userJson.id,
        this.name = userJson.name,
        this.email = userJson.email,
        this.password = userJson.password,
        this.avatar = userJson.avatar,
        this.lat = userJson.lat,
        this.lng = userJson.lng
    }

    static crearUsuario(usuarioJSON) {
        return new Promise( (resolve, reject) => {
            if (!usuarioJSON.name) return reject('Name is required');
            if (!usuarioJSON.email) return reject('Email is required');
            if (usuarioJSON.email !== usuarioJSON.email2) return reject('Emails are not equals');
            if (!usuarioJSON.password) return reject('Password is required');
            if (!usuarioJSON.avatar) return reject('Avatar is required');
           
            let data = {
                name: usuarioJSON.name,
                email: usuarioJSON.email,
                password: md5(usuarioJSON.password),
                avatar: usuarioJSON.avatar,
                lat: usuarioJSON.lat || 0,
                lng: usuarioJSON.lng || 0
            }

            conexion.query('INSERT INTO user set ?', data, (error, resultado, campose) => {
                if (error) {
                    if (error.sqlState === "23000") return reject('This email is already registered');
                    return reject(error);
                }

                if(resultado.affectedRows < 1) return reject('Error saving');
                else {
                    let token = this.generarToken(usuarioJSON.email, resultado.insertId);
                    
                    resolve({id: resultado.insertId, token:token});
                }
            });
        });
    }

    static crearUsuarioGoogle(data) {
        let datos = {
            id_google: data.id,
            email: data.emails[0].value,
            name: data.displayName,
            avatar: data.avatar
        }

        return new Promise( (resolve, reject) => {
            this.userExist(datos.id_google).then( resultado => {
                if (!resultado) {
                    conexion.query('INSERT INTO user set ?',datos, (error, resultado, campos) => {
                        if (error) {
                            if (error.sqlState === "23000") return reject('This email is already registered by other way, try another login method');
                            return reject('Login error');
                        }
                        if (resultado.affectedRows < 1) return reject('Create user failed');
                        resolve({token:this.generarToken(datos.email, resultado.insertId), new: true});
                    });
                } else {
                    resolve({token:this.generarToken(resultado.email, resultado.id), new: false});
                }
            });
        }) 
    }

    static crearUsuarioFacebook(data) {
        let datos = {
            id_facebook: data.id,
            email: data.email,
            name: data.name,
            avatar: data.avatar
        }

        return new Promise( (resolve, reject) => {
            this.userExist(datos.id_facebook).then( resultado => {
                if (!resultado) {
                    conexion.query('INSERT INTO user set ?',datos, (error, resultado, campos) => {
                        if (error) {
                            if (error.sqlState === "23000") return reject('This email is already registered by other way, try another login method');
                            return reject('Login error');
                        }
                        if (resultado.affectedRows < 1) return reject('Create user failed');
                        resolve({token:this.generarToken(datos.email, resultado.insertId), new: true});
                    });
                } else {
                    resolve({token:this.generarToken(datos.email, resultado.id), new: false});
                }
            });
        }) 
    }

    static userExist(id) {
        return new Promise( (resolve, reject) => {
            conexion.query(`SELECT * FROM user WHERE id_facebook = ${id} OR id_google = ${id}`, (error, resultado, campos) => {
                if (error) return reject(error);
                if (resultado[0]) resolve(new User(resultado[0]))
                resolve(false);
            })
        })
    }

    static getUser(idUser) {
        return new Promise( (resolve, reject) => {
            conexion.query(`SELECT id, name, email, avatar, lat, lng FROM user WHERE id = "${idUser}"`, (error, resultado, campos) => {
                if (error) return reject(error);
                if (resultado.length < 1) return reject('User not found');
                let user = new User(resultado[0]);
                resolve(user);
            });
        });
    }

    static getUsersAttend(idEvent) {
        return new Promise( (resolve, reject) => {
            conexion.query(`SELECT user.id, name, email, avatar FROM user, user_attend_event WHERE user.id = user AND event = ${idEvent} GROUP BY user.id`, (error, resultado, campos) => {
                if (error) return reject(error);
                if (resultado.length < 1) resolve([]);
                resolve( resultado.map( user => new User(user) ));
            });
        });
    }

    static validarUsuario(usuarioJSON) {
        return new Promise( (resolve, reject) => {
            conexion.query('SELECT password, id FROM user WHERE email="' + usuarioJSON.email + '";', (error, resultado, campos) => {

                if (error) return reject(error);

                if ( resultado.length <1 || resultado[0].password != md5(usuarioJSON.password)) {
                    return reject('Usuario o contraseña incorrecto');
                } else {
                    resolve(this.generarToken(usuarioJSON.email, resultado[0].id));
                }
            });
        });
    }

    static generarToken(email, id) {
        let token = jwt.sign({email: email, id:id}, secreto, {expiresIn: '1 day'});
        return token;
    }

    modificarEmailUser(data) {
        let datos = {
            email: data.email,
            name: data.name
        }

        return new Promise( (resolve, reject) => {
            if (!datos.email) return reject('Email can not be empty');
            if (!datos.name) return reject('Name can not be empty');
            
            conexion.query('UPDATE user SET ? WHERE id='+this.id,datos, (error, resultado, campos) => {
                if (error && error.sqlState === '23000') return reject('This email already exist')
                if (error || resultado.affectedRows < 1) return reject('Update error');
                resolve(resultado);
            });
        });
    }

    modificarAvatar(data) {
        let datos = {
            avatar:  data.avatar
        }

        return new Promise( (resolve, reject) => {
            if (!datos.avatar) return reject('File is not valid');
            conexion.query('UPDATE user SET ? WHERE id='+this.id,datos, (error, resultado, campos) => {
                if (error) return reject(error);
                if (resultado.affectedRows < 1) return reject('Avatar update error');
                resolve(resultado);
            });
        });
    }

    modificarPassword(data) {
        let datos = {
            password: data.password === data.password2 ? data.password : null
        }
        return new Promise( (resolve, reject) => {
            if( datos.password ) {
                datos.password = md5(datos.password);
                conexion.query('UPDATE user SET ? WHERE id='+this.id, datos, (error, resultado, campos) => {
                    if (error) return reject(error);
                    if (resultado.affectedRows < 1) return reject('Password update error');
                    resolve(resultado);
                });
            } else {
                return reject('Password is not valid');
            }
        });
    }

    static validarToken(token) {
        try {
            let resultado = jwt.verify(token, secreto);
            return resultado;
        } catch (e) {
            return false;
        }
    }

    static updatePosition(user, token) {
        let validToken = this.validarToken(token);
        let id = validToken ? validToken.id : false;

        return new Promise( (resolve, reject) => {
            if (user.lat && user.lng) {
                conexion.query(`UPDATE user SET lat=${user.lat}, lng=${user.lng} WHERE id=${id}`, (error, resultado, campos) => {
                    if (error) return reject(error);
                    if (resultado.affectedRows < 1) return reject('Error');
                    resolve(resultado);
                });
            }
            return reject('Coords not found');
        });
    }
}