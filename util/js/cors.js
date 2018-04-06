(function(dynCore) {
    dynCore.declare('lib.cors', function() {
        return function(options) {
            if (typeof(options) === 'string') {
                options = {
                    url: options
                };
            }
            options.crossDomain = true;
            options.xhrFields = {
               withCredentials: true
            };
            return $.ajax(options);
        };
    });
})(window.dynCore);