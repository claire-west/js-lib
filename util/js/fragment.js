(function(dynCore) {
    dynCore.declare('lib.fragment', [
        dynCore.require('core.namespace'),
        dynCore.require('lib.model')
    ], function(modules, namespace, model) {
        var pending = {};
        var templates = {};
        var constructors = {};
        var controllers = {};
        return {
            scan: function($element, model) {
                if (!$element || !$element.length) {
                    throw "Array binding has no template";
                }
                var tagName = $element.get(0).tagName.toLocaleLowerCase();
                if (tagName.startsWith('z--')) {
                    var promise = $.Deferred();

                    var path = tagName.substring(3) + '-' + ($element.attr('z--frag') || '');
                    path = path.split('-').filter(function(item) { return item; }).join('.');
                    $element.removeAttr('z--frag');

                    var $placeholder = $('<div/>');
                    // var $placeholder = $('<p/>', {
                    //     text: 'Loading... ', class: 'text-center'
                    // }).append($('<i/>', { class: 'fa fa-refresh fa-spin' }));
                    $element.replaceWith($placeholder);

                    var self = this;
                    this.get(path).done(function($fragment) {
                        var element = $element.get(0);
                        $.each(element.attributes, function() {
                            if (this.specified) {
                                $fragment.attr(this.name, this.value);
                            }
                        });

                        self.getController(path, $fragment).done(function(fn) {
                            $placeholder.replaceWith($fragment);
                            if (fn && typeof(fn) === 'function') {
                                var controller = fn($fragment, model);
                                model = controller.model;
                            }
                            promise.resolve($fragment, model);
                        }).fail(function() {
                            promise.reject();
                        });
                    }).fail(function() {
                        promise.reject();
                    });

                    return promise;
                }
            },

            preload: function(path, html) {
                if (!pending[path]) {
                    pending[path] = $.Deferred();
                    pending[path].resolve(html);
                }

                return pending[path];
            },

            get: function(path) {
                var promise = $.Deferred();

                if (templates[path]) {
                    promise.resolve(templates[path].clone());
                } else {
                    // Reuse existing requests instead of getting the same file again
                    pending[path] = pending[path] || $.get(namespace.fragment(path));
                    pending[path].done(function(frag){
                        templates[path] = $(frag);
                        promise.resolve(templates[path].clone());
                    }).fail(function() {
                        delete pending[path];
                        promise.reject();
                    });
                }

                return promise;
            },

            getController: function(path, $fragment) {
                if (path && typeof($fragment) === 'undefined' && constructors[path]) {
                    return constructors[path];
                }

                var controller = $fragment.attr('z--controller');
                $fragment.removeAttr('z--controller');
                if (typeof(controller) !== 'undefined') {
                    if (controller === '') {
                        controller = namespace.controller(path);
                    } else {
                        path = controller;
                        controller = namespace.controller(controller);
                    }

                    if (typeof(constructors[path]) === 'undefined') {
                        constructors[path] = $.Deferred();
                        controllers[path] = $.Deferred();
                        dynCore.js(controller);
                    } else {
                        // controller already exists, return for model binding
                        var promise = $.Deferred();
                        controllers[path].done(function(frag, proto) {
                            promise.resolve(function($fragment, parentModel) {
                                var self = Object.create(proto);
                                self.$fragment = $fragment;
                                if (frag.sharedModel) {
                                    self.model = frag.model;
                                } else {
                                    self.model = modules.lib.model(self.model, parentModel);
                                }
                                if (self.onInit) {
                                    self.onInit();
                                }
                                return self;
                            });
                        });
                        return promise;
                    }

                    return constructors[path];
                }

                return $.when();
            },

            controller: function(path, proto) {
                constructors[path] = constructors[path] || $.Deferred();
                controllers[path] = controllers[path] || $.Deferred();
                constructors[path].resolve(function($fragment, parentModel) {
                    var self = Object.create(proto);
                    self.$fragment = $fragment;
                    self.model = modules.lib.model(self.model, parentModel);
                    if (self.onInit) {
                        self.onInit();
                    }
                    controllers[path].resolve(self, proto);
                    return self;
                }, proto);
                return controllers[path];
            }
        };
    });
})(window.dynCore);