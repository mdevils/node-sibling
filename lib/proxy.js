var inherit = require('inherit'),
    Vow = require('vow'),
    EventEmitter = require('events').EventEmitter;

module.exports = function(decl, constructorArgs) {
    var emitter = new EventEmitter(),
        result = new (inherit({}))(),
        instance = new (inherit(EventEmitter, decl))();
    emitter.setMaxListeners(0);
    instance.__constructor__.apply(instance, constructorArgs);
    Object.keys(decl).forEach(function(funcName) {
        result[funcName] = function() {
            var args = arguments;
            return Vow.fulfill().then(function() {
                return instance[funcName].apply(instance, args);
            });
        };
    });
    var eventListeners = {};
    emitter.on('newListener', function(event) {
        if (!eventListeners[event]) {
            eventListeners[event] = {
                count: 0,
                callback: function() {
                    var args = [event].concat(Array.prototype.slice.call(arguments, 0));
                    process.nextTick(function() {
                        return emitter.emit.apply(emitter, args);
                    });
                }
            };
            instance.on(event, eventListeners[event].callback);
        }
        eventListeners[event].count++;
    });
    emitter.on('removeListener', function(event) {
        if (eventListeners[event]) {
            eventListeners[event].count--;
            if (eventListeners[event].count == 0) {
                instance.removeListener(event, eventListeners[event].callback);
                delete eventListeners[event];
            }
        }
    });
    ['addListener', 'on', 'once', 'removeListener'].forEach(function(methodName) {
        var method = emitter[methodName];
        result[methodName] = function() {
            var args = arguments;
            return Vow.fulfill().then(function() {
                return method.apply(emitter, args);
            });
        };
    });
    result.emit = function() {
        var args = arguments;
        return Vow.fulfill().then(function() {
            instance.emit.apply(instance, args);
        });
    };
    var dispose = result.dispose;
    result.dispose = function() {
        dispose.apply(result, arguments);
        emitter.removeAllListeners();
    };
    return result;
};