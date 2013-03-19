var inherit = require('inherit'),
    Server = require('./server');

module.exports = function(filename, decl) {
    decl['__constructor__'] = decl['__constructor'] || function() {};
    delete decl['__constructor'];
    this.fork = function() {
        return Server.run(filename, decl, Array.prototype.slice.call(arguments, 0));
    };
    this.create = function() {
        var instance = new (inherit(decl))();
        instance.__constructor__.apply(instance, arguments);
        return instance;
    };
    this.newInstance = function() {
        return new (inherit(decl))();
    };
};