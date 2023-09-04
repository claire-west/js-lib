(function(dynCore) {
    dynCore.declare('lib.bind', dynCore.require('lib', ['fragment', 'propGet', 'model']), function(modules, fragment, propGet) {
        var fnAfterScan = [];
        var bind = {
            scan: function(element, model, scopes) {
                var $element = $(element);
                scopes = scopes || {
                    '/': '_parent'
                };

                var frag = fragment.scan($element, model);
                if (frag) {
                    var promise = $.Deferred();
                    var self = this;
                    frag.done(function($element, fragmentModel) {
                        var fragmentScopes = {};

                        if ($element.attr('z--model')) {
                            var binding = JSON.parse($element.attr('z--model'));
                            $element.removeAttr('z--model');

                            if (fragmentModel === model) {
                                fragmentModel = modules.lib.model({}, model);
                            }

                            for (var key in binding) {
                                var path = self.parsePath(binding[key], scopes).path;
                                model._track(path, function(val, prev, i) {
                                    propGet.set(fragmentModel, key, val);
                                });
                            }
                        }

                        if (fragmentModel._parent === model) {
                            // Add / layer to scope so the fragment has its own, but can still navigate upward
                            for (var scope in scopes) {
                                fragmentScopes['/' + scope] = '_parent.' + scopes[scope];
                            }
                            var root = '';
                            var prefix = [];
                            do {
                                root += '/';
                                prefix.push('_parent');
                            } while (fragmentScopes[root]);
                            fragmentScopes[root] = prefix.join('.');
                        } else {
                            Object.assign(fragmentScopes, scopes);
                        }

                        self.scan($element, fragmentModel, fragmentScopes).done(function() {
                            fragmentModel._refresh();
                            promise.resolve();
                        }).fail(promise.reject);
                    }).fail(promise.reject);

                    return promise;
                }

                if ($element.attr('z--bind')) {
                    this.bindValue($element, model, scopes);
                }
                if ($element.attr('z--text')) {
                    this.bindText($element, model, scopes);
                }
                if ($element.attr('z--html')) {
                    this.bindHtml($element, model, scopes);
                }
                if ($element.attr('z--title')) {
                    this.bindTitle($element, model, scopes);
                }
                if ($element.attr('z--iterate')) {
                    scopes = this.bindArray($element, model, scopes);
                }

                if ($element.attr('z--click')) {
                    this.event('click', $element, model, scopes);
                }
                if ($element.attr('z--change')) {
                    this.event('change', $element, model, scopes);
                }
                if ($element.attr('z--keyup')) {
                    this.event('keyup', $element, model, scopes);
                }

                if ($element.attr('z--visible')) {
                    this.visible($element, model, scopes);
                }
                if ($element.attr('z--enabled')) {
                    this.enabled($element, model, scopes);
                }
                if ($element.attr('z--class')) {
                    this.class($element, model, scopes);
                }
                if ($element.attr('z--style')) {
                    this.style($element, model, scopes);
                }

                if ($element.attr('z--lazy')) {
                    this.lazy($element, model, scopes);
                    return $.when();
                }

                var promises = [];
                var $children = $element.children();
                for (var i = 0; i < $children.length; i++) {
                    promises.push(this.scan($children[i], model, scopes));
                }

                return $.when.apply(this, promises);
            },

            getBinding: function(binding, model, scopes) {
                if (binding[0] === '{' || binding[0] === '[') {
                    try {
                        binding = JSON.parse(binding);
                    } catch (e) {
                        binding = {
                            path: binding,
                            oneWay: false
                        };
                    }
                } else {
                    binding = {
                        path: binding,
                        oneWay: false
                    };
                }
                binding.path = binding.path || '';

                if (binding.path[0] === '=') {
                    binding.oneWay = true;
                    binding.path = binding.path.substring(1);
                }

                if (binding.path[0] === '!') {
                    if (binding.path[1] === '!') {
                        binding.forceBoolean = true;
                        binding.path = binding.path.substring(2);
                    } else {
                        binding.negateBoolean = true;
                        binding.path = binding.path.substring(1);
                    }
                }

                if (binding.args) {
                    if (!Array.isArray(binding.args)) {
                        binding.args = [ binding.args ];
                    }

                    for (var i = 0; i < binding.args.length; i++) {
                        binding.args[i] = this.parsePath(binding.args[i], scopes).path;
                    }
                }

                binding.model = model;
                return Object.assign(binding, this.parsePath(binding.path, scopes));
            },

            parsePath: function(path, scopes) {
                var scope = '';
                if (path[0] === '>') {
                    path = path.substring(1);
                    while (scopes[scope + '.']) {
                        scope += '.';
                    };

                    while (path[0] === '.') {
                        if (scope.indexOf('.') !== scope.lastIndexOf('.')) {
                            scope = scope.substring(0, scope.length - 1);
                            path = path.substring(1);
                        } else {
                            scope = '/' + scope.substring(0, scope.indexOf('.'))
                            if (typeof(scopes[scope]) === 'undefined') {
                                break;
                            }
                            scope += '.';
                            if (typeof(scopes[scope]) === 'undefined') {
                                continue;
                            } else {
                                path = path.substring(1);
                            }

                            while (scopes[scope + '.'] && path[0] === '.') {
                                scope += '.';
                                path = path.substring(1);
                            };
                        }
                    }
                } else if (path[0] === '^') {
                    path = path.substring(1);
                    while (scopes[scope + '/']) {
                        scope += '/';
                    };

                    while (path[0] === '/') {
                        scope = scope.substring(1);
                        path = path.substring(1);
                    }
                }

                while (path[0] === '/' || path[0] === '.') {
                    scope += path[0];
                    path = path.substring(1);
                }

                if (scopes[scope]) {
                    path = scopes[scope] + '.' + path;
                }

                return {
                    path: path,
                    scope: scope
                };
            },

            bindValue: function($element, model, scopes) {
                var args = Object.assign({
                    $element: $element
                }, this.getBinding($element.attr('z--bind'), model, scopes));
                $element.removeAttr('z--bind');

                if ($element.is('input:checkbox')) {
                    this.checkbox(args);
                } else if ($element.is('input, textarea, select')) {
                    this.input(args);
                } else if ($element.is('option')) {
                    args.oneWay = true;
                    this.input(args);
                } else if ($element.is('a')) {
                    this.attr('href', args);
                } else if ($element.is('img')) {
                    this.attr('src', args);
                } else {
                    this.text(args);
                }
            },

            bindText: function($element, model, scopes) {
                var args = Object.assign({
                    $element: $element
                }, this.getBinding($element.attr('z--text'), model, scopes));
                $element.removeAttr('z--text');

                if ($element.is('img')) {
                    this.attr('alt', args);
                } else {
                    this.text(args);
                }
            },

            bindHtml: function($element, model, scopes) {
                var args = Object.assign({
                    $element: $element
                }, this.getBinding($element.attr('z--html'), model, scopes));
                $element.removeAttr('z--html');

                this.html(args);
            },

            bindTitle: function($element, model, scopes) {
                var args = Object.assign({
                    $element: $element
                }, this.getBinding($element.attr('z--title'), model, scopes));
                $element.removeAttr('z--title');

                this.title(args);
            },

            bindArray: function($element, model, scopes) {
                var args = Object.assign({
                    $element: $element,
                    $template: $element.children('[z--template]').removeAttr('z--template').remove()
                }, this.getBinding($element.attr('z--iterate'), model, scopes));
                $element.removeAttr('z--iterate');

                this.array(args, scopes);
                return scopes;
            },

            checkModifiers: function(args, val, prev) {
                if (args.fn) {
                    var fn = args.model._get(args.fn);
                    if (fn) {
                        var params = [ val, prev ];
                        if (args.args) {
                            for (var i = 0; i < args.args.length; i++) {
                                params.push(args.model._get(args.args[i]));
                            }
                        }

                        val = fn.apply(this, params);
                    }
                }

                var valid = true;
                var compared = false;
                if (typeof(args.contains) !== 'undefined') {
                    compared = true;
                    valid = valid && val && val.includes(args.contains);
                }
                if (typeof(args.eq) !== 'undefined') {
                    compared = true;
                    valid = valid && val === args.eq;
                }
                if (typeof(args.ne) !== 'undefined') {
                    compared = true;
                    valid = valid && val !== args.ne;
                }
                if (typeof(args.gt) !== 'undefined') {
                    compared = true;
                    valid = valid && val > args.gt;
                }
                if (typeof(args.ge) !== 'undefined') {
                    compared = true;
                    valid = valid && val >= args.ge;
                }
                if (typeof(args.lt) !== 'undefined') {
                    compared = true;
                    valid = valid && val < args.lt;
                }
                if (typeof(args.le) !== 'undefined') {
                    compared = true;
                    valid = valid && val <= args.le;
                }

                if (!valid) {
                    val = false;
                } else if (compared) {
                    val = true;
                }

                if (args.forceBoolean) {
                    val = !!val;
                }
                if (args.negateBoolean) {
                    val = !val;
                }

                return val;
            },

            input: function(args) {
                var self = this;
                args.model._track(args.path, function(val, prev) {
                    args.$element.val(self.checkModifiers.call(args.$element, args, val, prev));
                });
                if (!args.oneWay) {
                    args.$element.on('keyup change', function() {
                        args.model._set(args.path, $(this).val());
                        args.model._refresh();
                    });
                }
            },

            checkbox: function(args) {
                var self = this;
                args.model._track(args.path, function(val, prev) {
                    args.$element.prop('checked', self.checkModifiers.call(args.$element, args, val, prev));
                });
                if (!args.oneWay) {
                    args.$element.on('change', function() {
                        args.model._set(args.path, $(this).is(':checked'));
                        args.model._refresh();
                    });
                }
            },

            attr: function(attr, args) {
                var self = this;
                args.model._track(args.path, function(val, prev) {
                    args.$element.attr(attr, self.checkModifiers.call(args.$element, args, val, prev));
                });
            },

            text: function(args) {
                var self = this;
                args.model._track(args.path, function(val, prev) {
                    var text = self.checkModifiers.call(args.$element, args, val, prev);
                    if (typeof(text) === 'undefined' || text === null) {
                        text = '';
                    }
                    args.$element.text(text);
                });
            },

            html: function(args) {
                var self = this;
                args.model._track(args.path, function(val, prev) {
                    var html = self.checkModifiers.call(args.$element, args, val, prev);
                    if (typeof(html) === 'undefined' || html === null) {
                        html = '';
                    }
                    args.$element.html(html);
                });
            },

            title: function(args) {
                var self = this;
                args.model._track(args.path, function(val, prev) {
                    args.$element.attr('title', self.checkModifiers.call(args.$element, args, val, prev));
                });
            },

            array: function(args, scopes) {
                var self = this;

                var arrScope = '.';
                while (typeof(scopes[arrScope]) !== 'undefined') {
                    arrScope += '.';
                }

                args.model._track(args.path, function(val, prev, i) {
                    var $existing = args.$element.children('[z--index=' + i + ']');
                    if ($existing.length && typeof(val) !== 'undefined' && val !== null && typeof(val[i]) !== 'undefined' && val[i] !== null) {
                        $existing.show();
                    } else if ($existing.length) {
                        $existing.hide();
                    } else if (typeof(val) !== 'undefined' && val !== null && typeof(val[i]) !== 'undefined' && val[i] !== null) {
                        var $clone = args.$template.clone();
                        $clone.attr('z--index', i);
                        args.$element.append($clone);

                        // Create a scope one level deeper than this binding
                        scopes = Object.assign({}, scopes);
                        scopes[arrScope] = args.path + '.' + i;
                        self.scan($clone, args.model, scopes);
                    }
                });
            },

            event: function(event, $element, model, scopes) {
                var self = this;
                var args = this.getBinding($element.attr('z--' + event), model, scopes);
                $element.removeAttr('z--' + event);

                args.args = args.args || [];
                args.self = this.parsePath('>', scopes).path;
                var element = $element.get(0);
                $element.on(event, function(e) {
                    var fn = model._get(args.path);
                    if (fn) {
                        var params = [ model._get(args.self) ];
                        for (var i = 0; i < args.args.length; i++) {
                            params.push(model._get(args.args[i]));
                        }
                        params.push(e);
                        fn.apply(element, params);
                    }
                });
            },

            visible: function($element, model, scopes) {
                var self = this;
                var args = this.getBinding($element.attr('z--visible'), model, scopes);
                $element.removeAttr('z--visible');

                args.model._track(args.path, function(val, prev) {
                    self.checkModifiers.call($element, args, val, prev) ? $element.show() : $element.hide();
                });
            },

            enabled: function($element, model, scopes) {
                var self = this;
                var args = this.getBinding($element.attr('z--enabled'), model, scopes);
                $element.removeAttr('z--enabled');

                args.model._track(args.path, function(val, prev) {
                    if (self.checkModifiers.call($element, args, val, prev)) {
                        $element.removeClass('disabled')
                        $element.prop('disabled', false);
                    } else {
                        $element.addClass('disabled');
                        $element.prop('disabled', true);
                    }
                });
            },

            class: function($element, model, scopes) {
                var self = this;
                var zClass = $element.attr('z--class');
                try {
                    zClass = JSON.parse(zClass);
                } catch (e) {
                    zClass = {};
                }

                if (!Array.isArray(zClass)) {
                    zClass = [ zClass ];
                }
                $element.removeAttr('z--class');

                for (let i = 0; i < zClass.length; i++) {
                    let args = this.getBinding(JSON.stringify(zClass[i]), model, scopes);
                    args.model._track(args.path, function(val, prev) {
                        if (self.checkModifiers.call($element, args, val, prev)) {
                            $element.addClass(args.class)
                        } else {
                            $element.removeClass(args.class);
                        }
                    });
                }
            },

            style: function($element, model, scopes) {
                var self = this;
                var zStyle = $element.attr('z--style');
                try {
                    zStyle = JSON.parse(zStyle);
                } catch (e) {
                    zStyle = {};
                }

                if (!Array.isArray(zStyle)) {
                    zStyle = [ zStyle ];
                }
                $element.removeAttr('z--style');

                for (let i = 0; i < zStyle.length; i++) {
                    let args = this.getBinding(JSON.stringify(zStyle[i]), model, scopes);
                    args.model._track(args.path, function(val, prev) {
                        if (self.checkModifiers.call($element, args, val, prev)) {
                            $element.css(args.style, val)
                        } else {
                            $element.css(args.style, '');
                        }
                    });
                }
            },

            lazy: function($element, model, scopes) {
                var self = this;
                var args = this.getBinding($element.attr('z--lazy'), model, scopes);
                $element.removeAttr('z--lazy');

                var $children = $element.children().remove();
                var loaded = false;
                args.model._track(args.path, function(val) {
                    if (!loaded && self.checkModifiers.call($element, args, val)) {
                        loaded = true;
                        $element.append($children);
                        self.scan($element, model, scopes).done(function() {
                            for (var i = 0; i < fnAfterScan.length; i++) {
                                fnAfterScan[i].call(this, $element, model, scopes);
                            }
                        }).fail(function() {
                            $element.empty();
                            loaded = false;
                        });
                    }
                });
            }
        };

        return function($element, model) {
            if (typeof($element) === 'function') {
                fnAfterScan.push($element);
                return;
            }
            return bind.scan($element, model).done(function() {
                for (var i = 0; i < fnAfterScan.length; i++) {
                    fnAfterScan[i].call(this, $element, model);
                }
            });
        };
    });
})(window.dynCore);