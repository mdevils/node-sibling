var Declaration = require('./lib/declaration'),
    Client = require('./lib/client');

module.exports = {
    declare: function(data) {
        var err = new Error(),
            errLines = err.stack.split('\n');
        errLines.shift();
        errLines.shift();
        var match = (/\(([^:]+)/g).exec(errLines.shift()),
            filename = match[1],
            decl = new Declaration(filename, data);
        if (process.env['NODE_SIBLING'] === filename) {
            var instance = decl.newInstance();
            Client.run(instance);
        }
        return decl;
    }
};