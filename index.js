var Sibling = require('./lib/sibling');
var getCallLocation = require('./lib/utils').getCallLocation;

(function() {
    var siblings = {};
    module.exports = {
        declare: function(classDecl) {
            var err = new Error();
            var callLoc = getCallLocation(err.stack);
            var sibling = new Sibling(callLoc.filename, callLoc.line, classDecl);
            siblings[sibling.getId()] = sibling;
            return sibling;
        },
        getById: function(id) {
            return siblings[id];
        }
    };
})();