var Vow = require('vow'),
    siblings = require('../index');

var objects = {},
    objectEventListeners = {};

function processMessage(msg) {
    var handler = messageHandlers[msg.type];
    if (handler) {
        handler(msg);
    } else {
        respondWithError(msg, new Error('Uknown sibling command: ' + msg.type));
    }
}

function callMethod(msg) {
    Vow.fulfill().then(function() {
        var object = objects[msg.objectId];
        if (!object) {
            throw new Error('Object not found for id: ' + msg.objectId);
        }
        return Vow.when(object[msg.methodName].apply(object, msg.args)).then(function(res) {
            process.send({
                type: 'methodCalled',
                promiseId: msg.promiseId,
                result: res
            });
        });
    }).fail(function(error) {
        respondWithError(msg, error);
    });
}

function addEventListener(msg) {
    var event = msg.event,
        objectId = msg.objectId,
        objectEvents = objectEventListeners[objectId] || (objectEventListeners[objectId] = {});
    objectEvents[event] = function() {
        var args = Array.prototype.slice.call(arguments, 0);
        process.send({
            type: 'newEvent',
            objectId: objectId,
            event: event,
            args: args
        });
    };
    objects[objectId].on(event, objectEvents[event]);
    process.send({
        type: 'eventListenerAdded',
        promiseId: msg.promiseId,
        result: null
    });
}

function removeEventListener(msg) {
    var event = msg.event,
        objectId = msg.objectId,
        objectEvents = objectEventListeners[objectId] || (objectEventListeners[objectId] = {});
    objects[objectId].removeListener(event, objectEvents[event]);
    delete objectEvents[event];
    process.send({
        type: 'eventListenerRemoved',
        promiseId: msg.promiseId,
        result: null
    });
}

function emitEvent(msg) {
    var event = msg.event,
        objectId = msg.objectId;
    objects[objectId].emit.apply(objects[objectId], [event].concat(msg.args));
    process.send({
        type: 'eventEmitted',
        promiseId: msg.promiseId,
        result: null
    });
}

function createObject(msg) {
    Vow.fulfill().then(function() {
        require(msg.filename);
        var sibling = siblings.getById(msg.siblingId);
        if (!sibling) {
            throw new Error('Sibling not found for id: ' + msg.siblingId);
        }
        var object = sibling.newInstance();
        object.__constructor__.apply(object, msg.args);
        objects[msg.objectId] = object;
        process.send({
            type: 'objectCreated',
            promiseId: msg.promiseId,
            result: null
        });
    }).fail(function(error) {
        respondWithError(msg, error);
    });
}

function disposeObject(msg) {
    Vow.fulfill().then(function() {
        var object = objects[msg.objectId];
        if (!object) {
            throw new Error('Object not found for id: ' + msg.objectId);
        }
        return Vow.when(object['dispose'].apply(object, msg.args)).then(function() {
            object.removeAllListeners();
            delete objects[msg.objectId];
            process.send({
                type: 'objectDisposed',
                promiseId: msg.promiseId,
                objectId: msg.objectId,
                result: null
            });
        });
    }).fail(function(error) {
        respondWithError(msg, error);
    });
}

function respondWithError(msg, error) {
    error = error || {};
    process.send({
        type: 'error',
        promiseId: msg.promiseId,
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack
        }
    });
}

var messageHandlers = {
    methodCall: callMethod,
    createObject: createObject,
    disposeObject: disposeObject,
    addEventListener: addEventListener,
    removeEventListener: removeEventListener,
    emitEvent: emitEvent
};

process.on('message', processMessage);
