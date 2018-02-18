/**
 * @author Ivan Galan Pastor
 * Fichero de configuración de la conexión a la base de datos
 */
const mysql = require('mysql');

let conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'svtickets'
});

module.exports = conexion;
