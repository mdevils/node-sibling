node-sibling
============

Fast and easy IPC for node.

Installation
------------

```
npm install sibling
```

Usage
-----

Master process code, **runner.js**.
```javascript
var Vow = require('vow'),
    UserSibling = require('./user.js');

// Local UserSibling instance usage.
var user = UserSibling.create('Nick');
Vow.when(user.getName()).then(function() {
    console.log('local user name', user.getName());
    return Vow.when(user.getFriends()).then(function(friends) {
        console.log('local user friends', friends);
    }).then(function() {
        return Vow.when(user.getMotherName());
    }).fail(function(error) {
        console.log('local user mother name ', error.toString());
        Vow.when(user.getFatherName()).fail(function(error) {
            console.log('local user father name ', error.toString());
            user.dispose();
        });
    });
});

// Child process UserSibling instance usage.
var userSibling = UserSibling.fork('Nick');
Vow.when(userSibling.getName()).then(function(name) {
    console.log('sibling user name', name);
    return Vow.when(userSibling.getFriends()).then(function(friends) {
        console.log('sibling user friends', friends);
    }).then(function() {
        return Vow.when(userSibling.getMotherName());
    }).fail(function(error) {
        console.log('sibling user mother name ', error.toString());
        Vow.when(userSibling.getFatherName()).fail(function(error) {
            console.log('sibling user father name ', error.toString());
            userSibling.dispose();
        });
    });
});
```

Child/Master shared code, **user.js**.
```javascript
var sibling = require('../index'),
    Vow = require('vow');

module.exports = sibling.declare({
    __constructor: function(name) {
        this._name = name;
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
    }
});
```
