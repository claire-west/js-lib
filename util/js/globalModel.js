(function(dynCore) {
    dynCore.declare('lib.globalModel', dynCore.require('lib.model'), function(modules, model) {
        var model = model({ test: 'This is from the global model.' });
        return model;
    });
})(window.dynCore);