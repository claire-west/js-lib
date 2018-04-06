(function(dynCore) {
    dynCore.declare('lib.delayedAction', dynCore.require('lib.isMobile'), function(modules) {
        var timeouts = {};
        var delay = 200;
        if (modules.lib.isMobile()) {
            delay = 300;
        }

        return function(fn, id) {
            // id is optional to avoid conflicting delays, though that'll probably never happen...
            // undefined is not a valid object key, but null is, so use that for the shared timeout
            if (typeof(id) === 'undefined') {
                id = null;
            }
            clearTimeout(timeouts[id]);
            timeouts[id] = setTimeout(fn, delay);
        };
    });
})(window.dynCore);