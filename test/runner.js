var Vow = require('vow'),
    Worker = require('../lib/worker.js'),
    UserSibling = require('./user.sibling.js');

var user = UserSibling.create('Nick');
user.getName().then(function(name) {
    console.log('local user name', name);
    return Vow.when(user.getFriends()).then(function(friends) {
        console.log('local user friends', friends);
    }).then(function() {
        return Vow.when(user.getMotherName());
    }).fail(function(error) {
        console.log('local user mother name ', error.toString());
        return Vow.when(user.getFatherName()).fail(function(error) {
            console.log('local user father name ', error.toString());
            user.on('event', function(data) {
                console.log('local user event: ', data);
                user.emit('secret-event').then(function() {
                    user.dispose();
                });
            }).then(function() {
                return user.doSomething();
            });
        });
    });
});

var userSibling = UserSibling.fork('Nick');
userSibling.getName().then(function(name) {
    console.log('sibling user name', name);
    return Vow.when(userSibling.getFriends()).then(function(friends) {
        console.log('sibling user friends', friends);
    }).then(function() {
        return Vow.when(userSibling.getMotherName());
    }).fail(function(error) {
        console.log('sibling user mother name ', error.toString());
        return Vow.when(userSibling.getFatherName()).fail(function(error) {
            console.log('sibling user father name ', error.toString());
            userSibling.on('event', function(data) {
                console.log('sibling user event: ', data);
                userSibling.emit('secret-event').then(function() {
                    userSibling.dispose();
                });
            }).then(function() {
                return userSibling.doSomething();
            });
        });
    });
});

var worker = new Worker();
worker.start();
worker.on('lastObjectDisposed', function() {
    worker.stop();
});
var user1 = worker.createObject(UserSibling, ['Garry']),
    user2 = worker.createObject(UserSibling, ['Gordon']);

Vow.all([user1.getName(), user2.getName()]).then(function(names) {
    console.log('multiple get names: ', names);
    user1.dispose();
    user2.dispose();
});
