(function(dynCore) {
    dynCore.declare('lib.hashWatch', function(modules) {
        var handlers = [];

        var onHashChange = function() {
            var args = window.location.hash.substr(1).split('/');
            for (var i = 0; i < handlers.length; i++) {
                if (handlers[i].condition.call(this, args)) {
                    handlers[i].fn.apply(this, args);
                }
            }
        };

        window.addEventListener("hashchange", onHashChange);

        return function(condition, handler, noinit) {
            handlers = handlers || [];
            handlers.push({
                condition: condition,
                fn: handler
            });
            if (!noinit) {
                var args = window.location.hash.substr(1).split('/');
                handler.apply(this, args);
            }
        };
    });
})(window.dynCore);