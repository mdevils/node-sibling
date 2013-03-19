var inherit = require('inherit'),
    Vow = require('vow');

module.exports = function(decl, constructorArgs) {
    var result = {},
        instance = new (inherit(decl))();
    instance.__constructor__.apply(instance, constructorArgs);
    Object.keys(decl).forEach(function(funcName) {
        result[funcName] = function() {
            var args = arguments;
            return Vow.fulfill().then(function() {
                return instance[funcName].apply(instance, args);
            });
        };
    });
    return result;
};