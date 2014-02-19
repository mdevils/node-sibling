var utils = require('../lib/utils');
require('chai').should();

describe('utils', function() {
    describe('getCallLocation method', function() {
        var getCallLocation = utils.getCallLocation;
        it('parse windows error trace', function(done) {
            var winTrace = 'Error\n    at Object.module.exports.declare (C:\\makeup\\bem\\node_modules\\enb\\node_modules\\sibling\\index.js:7:23)\n    at Object.<anonymous> (C:\\makeup\\bem\\node_modules\\enb\\techs\\borschik.js:85:51)\n    at Module._compile (module.js:456:26)\n    at Object.Module._extensions..js (module.js:474:10)\n    at Module.load (module.js:356:32)\n    at Function.Module._load (module.js:312:12)\n    at Module.require (module.js:364:17)\n    at require (module.js:380:17)\n    at C:\\makeup\\bem\\.bem\\enb-make.js:33:19\n    at keepRunning (C:\\makeup\\bem\\node_modules\\enb\\lib\\config\\configurable.js:50:44)';
            getCallLocation(winTrace).should.deep.equal({
                filename: 'C:\\makeup\\bem\\node_modules\\enb\\techs\\borschik.js',
                line: '85'
            });
            done();
        });
        it('parse linux error trace', function(done) {
            var linuxTrace = 'Error\n    at Object.module.exports.declare (/opt/www/rakchaev/mygit/bem/node_modules/enb/node_modules/sibling/index.js:7:23)\n    at Object.<anonymous> (/opt/www/rakchaev/mygit/bem/node_modules/enb/techs/borschik.js:85:51)\n    at Module._compile (module.js:456:26)\n    at Object.Module._extensions..js (module.js:474:10)\n    at Module.load (module.js:356:32)\n    at Function.Module._load (module.js:312:12)\n    at Module.require (module.js:364:17)\n    at require (module.js:380:17)\n    at /opt/www/rakchaev/mygit/bem/.bem/enb-make.js:33:19\n    at keepRunning (/opt/www/rakchaev/mygit/bem/node_modules/enb/lib/config/configurable.js:50:44)';
            getCallLocation(linuxTrace).should.deep.equal({
                filename: '/opt/www/rakchaev/mygit/bem/node_modules/enb/techs/borschik.js',
                line: '85'
            });
            done();
        });
    });
});
