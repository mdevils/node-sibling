var inherit = require('inherit'),
    Server = require('./server'),
    proxy = require('./proxy');

module.exports = function(filename, line, decl) {
    decl['__constructor__'] = decl['__constructor'] || function() {};
    decl['dispose'] = decl['dispose'] || function() {};
    delete decl['__constructor'];
    this.getFilename = function() {
        return filename;
    };
    this.getLine = function() {
        return line;
    };
    this.getDecl = function() {
        return decl;
    };
    this.fork = function() {
        return Server.run(this, Array.prototype.slice.call(arguments, 0));
    };
    this.create = function() {
        return proxy(decl, arguments);
    };
    this.newInstance = function() {
        return new (inherit(decl))();
    };
};