var Vow = require('vow');

module.exports.run = function(object) {
    process.on('message', function(msg) {
        switch (msg.type) {
            case 'methodCall':
                Vow.when(object[msg.methodName].apply(object, msg.args)).then(function(res) {
                    process.send({
                        type: 'methodCallResult',
                        promiseId: msg.promiseId,
                        result: res
                    });
                });
        }
    });
};