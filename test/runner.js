var Vow = require('vow'),
    UserSibling = require('./user.sibling.js');

var user = UserSibling.create('Nick');
Vow.when(user.getName()).then(function() {
    console.log('local user name', user.getName());
    return Vow.when(user.getFriends()).then(function(friends) {
        console.log('local user friends', friends);
    });
});

var userSibling = UserSibling.fork('Nick');
Vow.when(userSibling.getName()).then(function(name) {
    console.log('sibling user name', name);
    return Vow.when(userSibling.getFriends()).then(function(friends) {
        console.log('sibling user friends', friends);
        userSibling.dispose();
    });
});
