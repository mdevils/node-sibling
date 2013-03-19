var Vow = require('vow'),
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
        Vow.when(user.getFatherName()).fail(function(error) {
            console.log('local user father name ', error.toString());
            user.dispose();
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
        Vow.when(userSibling.getFatherName()).fail(function(error) {
            console.log('sibling user father name ', error.toString());
            userSibling.dispose();
        });
    });
});

