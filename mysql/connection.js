var mysql = require('mysql');
var properties = require("properties-parser");


function Connection() {
    this.pool = null;

    this.init = function () {
      properties.read("./mysql.properties", function (error, properties) {
        if (error) return console.error(error);
        console.log('Conexion inicializada');
        this.pool = mysql.createPool({
          connectionLimit: properties['connectionLimit'],
          host: properties['host'],
          user: properties['user'],
          password: properties['password'],
          database: properties['database']
        });
      });
    };

    function _acquire(callback) {
      if(this.pool == null) {
        setTimeout(function(){
          _acquire(callback);
        }, 0);
        return;
      }
      this.pool.getConnection(function (err, connection) {
        callback(err, connection);
      });
    }
    this.acquire = _acquire;
}
module.exports = new Connection();