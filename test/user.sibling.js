var sibling = require('../index'),
    Vow = require('vow');

module.exports = sibling.declare({
    __constructor: function(name) {
        this._name = name;
        this.on('secret-event', function() {
            console.log('Secret event!!');
        });
    },
    getName: function() {
        return this._name;
    },
    getFriends: function() {
        var promise = Vow.promise();
        setTimeout(function() {
            promise.fulfill([
                'Michael',
                'George'
            ]);
        }, 1000);
        return promise;
    },
    getMotherName: function() {
        throw new Error('Private info');
    },
    getFatherName: function() {
        return Vow.reject(new Error('Unknown info'));
    },
    doSomething: function() {
        this.emit('event', 'something was done');
    }
});