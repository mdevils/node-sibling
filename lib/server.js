var Vow = require('vow'),
    childProcess = require('child_process');

module.exports.run = function(sibling, args) {
    var result = {},
        decl = sibling.getDecl(),
        filename = sibling.getFilename(),
        line = sibling.getLine(),
        child = childProcess.fork(filename, [], {
            env: {
                'NODE_SIBLING_FILE': filename,
                'NODE_SIBLING_LINE': line
            }
        }),
        callResultPromises = {},
        lastPromiseId = 0,
        constructorPromise;

    function callMethod(methodName, args) {
        lastPromiseId++;
        child.send({
            type: 'methodCall',
            methodName: methodName,
            args: args,
            promiseId: lastPromiseId
        });
        return callResultPromises[lastPromiseId] = Vow.promise();
    }

    child.on('message', function(msg) {
        switch (msg.type) {
            case 'methodCallResult':
                if (msg.error) {
                    callResultPromises[msg.promiseId].reject(
                        new SiblingError(msg.error.name, msg.error.message, msg.error.stack)
                    );
                } else {
                    callResultPromises[msg.promiseId].fulfill(msg.result);
                }
                delete callResultPromises[msg.promiseId];
        }
    });
    constructorPromise = callMethod('__constructor__', args);

    Object.keys(decl).forEach(function(funcName) {
        result[funcName] = function() {
            var callArgs = Array.prototype.slice.call(arguments, 0);
            return constructorPromise.then(function(){
                return callMethod(funcName, callArgs);
            });
        };
    });

    result.dispose = function() {
        callMethod('dispose', Array.prototype.slice.call(arguments, 0)).always(function() {
            child.kill();
            callResultPromises = null;
            constructorPromise = null;
            child = null;
            decl = null;
        });
    };

    return result;
};

function SiblingError(name, message, stack) {
    this.name = name;
    this.message = message;
    this.stack = stack;
    this.toString = function() {
        return this.name + ': ' + this.message;
    };
}
SiblingError.prototype = Error.prototype;