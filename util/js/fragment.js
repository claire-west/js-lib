(function(dynCore) {
    dynCore.declare('lib.fragment', [
        dynCore.require('core.namespace'),
        dynCore.require('lib.model')
    ], function(modules, namespace, model) {
        var pending = {};
        var templates = {};
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

                    var $placeholder = $('<p/>', {
                        text: 'Loading... ', class: 'text-center'
                    }).append($('<i/>', { class: 'fa fa-refresh fa-spin' }));
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
                if (path && typeof($fragment) === 'undefined' && controllers[path]) {
                    return controllers[path];
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

                    if (typeof(controllers[path]) === 'undefined') {
                        controllers[path] = $.Deferred();
                        dynCore.js(controller);
                    } else {
                        // controller already exists, return for model binding
                        var promise = $.Deferred();
                        controllers[path].done(function(frag) {
                            promise.resolve(function() {
                                if (frag.reinit && frag.onInit) {
                                    frag.onInit();
                                }
                                return frag;
                            });
                        });
                        return promise;
                    }

                    return controllers[path];
                }

                return $.when();
            },

            controller: function(path, controller) {
                controllers[path] = controllers[path] || $.Deferred();
                controllers[path].resolve(function($fragment, model) {
                    var self = Object.create(controller);
                    self.$fragment = $fragment;
                    self.model = modules.lib.model(self.model, model);
                    if (self.onInit) {
                        self.onInit();
                    }
                    controllers[path] = $.when(self);
                    return self;
                });
                return controllers[path];
            },

            instantiate: function(path) {
                var promise = $.Deferred();

                self.getController(path, $fragment).done(function(fn) {
                    if (fn) {
                        var controller = fn($fragment, model);
                        model = controller.model;
                    }
                    $element.replaceWith($fragment);
                    promise.resolve($fragment, model);
                }).fail(function() {
                    promise.reject();
                });

                return promise;
            }
        };
    });
})(window.dynCore);