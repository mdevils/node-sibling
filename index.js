var Sibling = require('./lib/sibling'),
    Client = require('./lib/client');

module.exports = {
    declare: function(classDecl) {
        var err = new Error(),
            errLines = err.stack.split('\n');
        errLines.shift();
        errLines.shift();
        var match = (/\(([^:]+):(\d+)/g).exec(errLines.shift()),
            filename = match[1],
            line = match[2],
            decl = new Sibling(filename, line, classDecl);
        if (process.env['NODE_SIBLING_FILE'] === filename && process.env['NODE_SIBLING_LINE'] === line) {
            var instance = decl.newInstance();
            Client.run(instance);
        }
        return decl;
    }
};