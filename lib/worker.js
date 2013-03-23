var inherit = require('inherit'),
    childProcess = require('child_process'),
    Vow = require('vow'),
    runnerPath = __dirname + '/runner.js';

module.exports = inherit(require('events').EventEmitter, {
    __constructor: function() {
        this._process = null;
        this._objectCount = 0;
        this._objects = {};
        this._lastObjectId = 0;
        this._lastPromiseId = 0;
        this._callResultPromises = {};
        this._onMessageHandler = this._onMessage.bind(this);
        this._stoppingPromise = null;
    },
    start: function() {
        this._stoppingPromise = null;
        this._process = childProcess.fork(runnerPath);
        this._process.on('message', this._onMessageHandler);
        this.emit('started');
    },
    stop: function(force) {
        if (force) {
            this._forceStop(force);
            return Vow.fulfill();
        } else {
            var _this = this, objects = this._objects;
            return this._stoppingPromise || (this._stoppingPromise = Vow.all(Object.keys(objects).map(function(objectId) {
                return objects[objectId].dispose();
            })).then(function() {
                _this._forceStop();
            }));
        }
    },
    _forceStop: function() {
        this._process.removeListener('message', this._onMessageHandler);
        this._process.kill();
        this.emit('stopped');
    },
    _request: function(msg) {
        this._lastPromiseId++;
        msg.promiseId = this._lastPromiseId;
        this._process.send(msg);
        return this._callResultPromises[this._lastPromiseId] = Vow.promise();
    },
    _onMessage: function(msg) {
        var promise = msg.promiseId && this._callResultPromises[msg.promiseId];
        switch (msg.type) {
            case 'objectCreated':
                this._objectCount++;
                promise && promise.fulfill(msg.result);
                if (this._objectCount == 1) {
                    this.emit('firstObjectCreated');
                }
                break;
            case 'objectDisposed':
                promise && promise.fulfill(msg.result);
                delete this._objects[msg.objectId];
                this._objectCount--;
                if (this._objectCount == 0) {
                    this.emit('lastObjectDisposed');
                }
                break;
            case 'methodCalled':
            case 'eventListenerAdded':
            case 'eventListenerRemoved':
            case 'eventEmitted':
                promise && promise.fulfill(msg.result);
                break;
            case 'newEvent':
                var object = this._objects[msg.objectId];
                object.__emit.apply(object, [msg.event].concat(msg.args));
                break;
            case 'error':
                promise && promise.reject(new SiblingError(msg.error.name, msg.error.message, msg.error.stack));
                break;
        }
    },
    createObject: function(sibling, constructorArgs) {
        var _this = this,
            result = {},
            decl = sibling.getDecl(),
            objectId = ++this._lastObjectId,
            constructorPromise = this._request({
                type: 'createObject',
                siblingId: sibling.getId(),
                objectId: objectId,
                filename: sibling.getFilename(),
                args: constructorArgs
            });

        this._objects[objectId] = result;

        function callMethod(methodName, args) {
            return constructorPromise.then(function() {
                return _this._request({
                    type: 'methodCall',
                    objectId: objectId,
                    methodName: methodName,
                    args: args
                });
            });
        }

        Object.keys(decl).forEach(function(funcName) {
            result[funcName] = function() {
                var callArgs = Array.prototype.slice.call(arguments, 0);
                return constructorPromise.then(function() {
                    return callMethod(funcName, callArgs);
                });
            };
        });

        result.dispose = function() {
            return _this._request({
                type: 'disposeObject',
                objectId: objectId,
                args: Array.prototype.slice.call(arguments, 0)
            }).always(function() {
                decl = null;
                result = null;
                constructorPromise = null;
            });
        };

        var listeners = {};
        result.on = result.addListener = function(event, listener) {
            listeners[event] = listeners[event] || [];
            if (listeners[event].indexOf(listener) === -1) {
                listeners[event].push(listener);
                if (listeners[event].length == 1) {
                    return _this._request({
                         type: 'addEventListener',
                         objectId: objectId,
                         event: event
                     });
                }
            }
            return Vow.fulfill();
        };
        result.removeListener = function(event, listener) {
            if (listeners[event]) {
                var lpos = listeners[event].indexOf(listener);
                if (lpos !== -1) {
                    listeners[event].splice(lpos, 1);
                    if (listeners[event].length == 0) {
                        delete listeners[event];
                        return _this._request({
                            type: 'removeEventListener',
                            objectId: objectId,
                            event: event
                        });
                    }
                }
            }
            return Vow.fulfill();
        };
        result.once = function(event, listener) {
            var listenerWrapper = function() {
                var eventArgs = [];
                result.removeListener(event, listenerWrapper).then(function() {
                    listener.apply(null, eventArgs);
                });
            };
            return this.on(event, listenerWrapper);
        };
        result.emit = function() {
            var args = Array.prototype.slice.call(arguments, 0),
                event = args.shift();
            return _this._request({
                type: 'emitEvent',
                objectId: objectId,
                event: event,
                args: args
             });
        };
        result.__emit = function() {
            var args = Array.prototype.slice.call(arguments, 0),
                event = args.shift(),
                listenerList = listeners[event];
            if (listenerList) {
                for (var i = 0, l = listenerList.length; i < l; i++) {
                    listenerList[i].apply(null, args);
                }
            }
        };
        return result;
    }
});

function SiblingError(name, message, stack) {
    this.name = name;
    this.message = message;
    this.stack = stack;
    this.toString = function() {
        return this.name + ': ' + this.message;
    };
}
SiblingError.prototype = Error.prototype;