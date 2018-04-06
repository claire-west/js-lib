(function(dynCore) {
    dynCore.declare('lib.nosql', dynCore.require('lib.cors'), function(modules) {
        var url = dynCore.getResource('node') + '/nosql/';
        var cors = modules.lib.cors;
        return {
            get: function() {
                return cors(url + Array.prototype.slice.call(arguments).join('/'));
            },

            save: function(meta, data) {
                var postURL;
                if (typeof(data) === 'undefined') {
                    data = meta;
                    postURL = data.Meta;
                } else {
                    postURL = url + meta;
                }

                return cors({
                    url: postURL,
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(data)
                });
            },

            delete: function() {
                return cors({
                    url: url + Array.prototype.slice.call(arguments).join('/'),
                    method: 'DELETE'
                });
            },

            resources: function() {
                return cors(url + 'resources/' + Array.prototype.slice.call(arguments).join('-'));
            }
        }
    });
})(window.dynCore);