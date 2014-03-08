var utils = {

    /**
     * Gets filename and line of call from error stack
     *
     * @param {string} errorStack The error stack to parse
     * @returns {object} Returns object with filename and line
     */
    getCallLocation: function(errorStack) {
        var errLines = errorStack.split('\n');
        errLines.shift();
        errLines.shift();
        var match = (/\(((?:\w{1}:)?[^:]+):(\d+)/g).exec(errLines.shift());
        return {
            filename: match[1],
            line: match[2]
        };
    }
};

module.exports = utils;
