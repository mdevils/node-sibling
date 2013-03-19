var Vow = require('vow');

module.exports.run = function(object) {
    process.on('message', function(msg) {
        switch (msg.type) {
            case 'methodCall':
                Vow.fulfill().then(function() {
                    return Vow.when(object[msg.methodName].apply(object, msg.args)).then(function(res) {
                        process.send({
                            type: 'methodCallResult',
                            promiseId: msg.promiseId,
                            result: res
                        });
                    });
                }).fail(function(error) {
                    error = error || {};
                    process.send({
                        type: 'methodCallResult',
                        promiseId: msg.promiseId,
                        error: {
                            name: error.name,
                            message: error.message,
                            stack: error.stack
                        }
                    });
                });
                break;
        }
    });
};