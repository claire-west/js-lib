(function(dynCore) {
    dynCore.declare('lib.baseSection', [
        dynCore.require('lib', [
            'hashNav',
            'fragment'
        ])
    ], function(modules, hashNav, fragment) {
        return function(path, section) {
            fragment.controller(path, section).done(function() {
                fragment.getController(path).done(function(section) {
                    section.find = function(selector) {
                        return section.$fragment.find(selector);
                    }

                    if (section.onNavTo) {
                        var sectionName = path.split('.').pop();
                        section.model._parent._set('onNav.' + sectionName, function() {
                            section.onNavTo.apply(section, arguments);
                        });
                        hashNav.rehash();
                    }
                });
            });
        };
    })
})(window.dynCore);