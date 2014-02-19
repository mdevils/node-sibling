var Sibling = require('./lib/sibling');

(function() {
    var siblings = {};
    module.exports = {
        declare: function(classDecl) {
            var err = new Error(),
                errLines = err.stack.split('\n');
            errLines.shift();
            errLines.shift();
            var match = (/\(((?:\w{1}:)?[^:]+):(\d+)/g).exec(errLines.shift()),
                filename = match[1],
                line = match[2],
                sibling = new Sibling(filename, line, classDecl);
            siblings[sibling.getId()] = sibling;
            return sibling;
        },
        getById: function(id) {
            return siblings[id];
        }
    };
})();