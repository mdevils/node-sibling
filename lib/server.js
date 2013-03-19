var Vow = require('vow'),
    childProcess = require('child_process');

module.exports.run = function(filename, decl, args) {
    var result = {},
        child = childProcess.fork(filename, [], {
            env: {'NODE_SIBLING': filename}
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
                callResultPromises[msg.promiseId].fulfill(msg.result);
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
        child.kill();
    };

    return result;
};