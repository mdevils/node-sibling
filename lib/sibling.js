var inherit = require('inherit'),
    Worker = require('./worker'),
    proxy = require('./proxy'),
    EventEmitter = require('events').EventEmitter;

module.exports = function(filename, line, decl) {
    decl['__constructor__'] = decl['__constructor'] || function() {};
    decl['dispose'] = decl['dispose'] || function() {};
    delete decl['__constructor'];
    this.getFilename = function() {
        return filename;
    };
    this.getId = function() {
        return filename + ':' + line;
    };
    this.getDecl = function() {
        return decl;
    };
    this.fork = function() {
        var worker = new Worker();
        worker.start();
        worker.on('lastObjectDisposed', function() {
            worker.stop();
        });
        return worker.createObject(this, Array.prototype.slice.call(arguments, 0));
    };
    this.create = function() {
        return proxy(decl, arguments);
    };
    this.newInstance = function() {
        return new (inherit(EventEmitter, decl))();
    };
};