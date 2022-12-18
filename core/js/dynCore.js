(function() {
    if (typeof($) === 'undefined') {
        alert('Error: jQuery is undefined');
        throw 'jQuery is undefined';
    }

    var ready = $.Deferred();
    var $this = $('script[src$="dynCore.js"]');

    var preload = {};
    var loadedModules = [];
    var modules = {};
    var templates = {};
    var templateNotified = {};
    var unresolved = {};
    var pending = [];
    var pendingJSON = {};
    var debug = window.location.search.indexOf('debug') > -1;

    var resources = $this.data('res');
    if (typeof(resources) !== 'object') {
        resources = {};
        console.warn('dynCore-data-res is not valid JSON.');
    }

    var getScript = function(url) {
        if (loadedModules.indexOf(url) > -1) {
            console.warn('Module at ' + url + ' already loaded.');
            return $.when();
        }

        return $.getScript(url)
            .done(function() {
                console.info('Module ' + url + ' loaded.');
                loadedModules.push(url);
            }).fail(function(resp, e) {
                console.error('Unable to load module (' + e + ') - ', url);
            }
        );
    };

    var defaultNamespaces = $this.data('ns');
    if (typeof(defaultNamespaces) !== 'object') {
        defaultNamespaces = {};
        console.warn('dynCore-data-ns is not valid JSON.');
    }
    defaultNamespaces.core = $this.prop('src').replace(window.location.origin, '').replace('/js/dynCore.js', '');
    defaultNamespaces.lib = defaultNamespaces.lib || defaultNamespaces.core.replace('/core', '/util');
    defaultNamespaces.vendor = defaultNamespaces.vendor || defaultNamespaces.core.replace('/core', '/vend');

    var dynCore = window.dynCore = {
        ready: function(fn) {
            ready.done(fn);
        },
        setResource: function(key, value) {
            resources[key] = value;
        },
        getResource: function(key) {
            return resources[key] || key;
        },
        modules: function(path) {
            if (path) {
                var parts = path.split('.');
                var target = modules;
                for (var i = 0; i < parts.length; i++) {
                    target = target[parts[i]];
                }
                return target;
            }
            return modules;
        },
        when: function() {
            var promise = $.Deferred();
            $.when.apply(this, arguments).done(function() {
                var loadedModules = [ modules ];
                for (var i = 0; i < arguments.length; i++) {
                    if (arguments[i] && arguments[i].modules) {
                        if (Array.isArray(arguments[i].modules)) {
                            loadedModules = loadedModules.concat(arguments[i].modules);
                        } else {
                            loadedModules.push(arguments[i].modules);
                        }
                    }
                }

                window.dynCore.resolve().done(function() {
                    promise.resolve.apply(this, loadedModules);
                });
            });
            return promise;
        },
        declare: function(title, promises, fnInit) {
            if (typeof(fnInit) === 'undefined' && typeof(promises) === 'function') {
                fnInit = promises;
                promises = $.Deferred().resolve();
            }

            var promise = window.dynCore.pending();

            if (!Array.isArray(promises)) {
                promises = [promises];
            }

            var self = this;
            $.when.apply(this, promises).done(function() {
                var loadedModules = [ modules ];
                for (var i = 0; i < arguments.length; i++) {
                    if (arguments[i] && Array.isArray(arguments[i].modules)) {
                        loadedModules = loadedModules.concat(arguments[i].modules);
                    }
                }

                var module;
                if (fnInit) {
                    module = fnInit.apply(self, loadedModules);
                    var parts = title.split('.');

                    var target = modules;
                    var part = parts.shift();
                    while (parts.length) {
                        target = target[part] = target[part] || {};
                        part = parts.shift();
                    }
                    target[part] = module;
                }
                if (unresolved[title]) {
                    unresolved[title].resolve(module);
                }
                promise.resolve.apply(self, loadedModules);
            }).fail(function() {
                console.error('Failed to load prerequisites for ' + title);
                promise.reject();
            });
            return promise;
        },
        pending: function() {
            var promise = $.Deferred();
            pending.push(promise);
            promise.always(function() {
                pending.splice(pending.indexOf(promise), 1);
            });
            return promise;
        },
        resolve: function() {
            return $.when.apply(this, pending);
        },
        getUnresolved: function() {
            return unresolved;
        }
    };

    getScript(defaultNamespaces.core + '/js/polyfill.js').done(function() {
        getScript(defaultNamespaces.core + '/js/namespace.js').done(function() {
            var ns = modules.core.namespace;
            ns.register(defaultNamespaces);
            unresolved['core.namespace'] = $.Deferred().resolve(ns);

            Object.assign(dynCore, {
                js: function(title) {
                    return getScript(ns.js(title));
                },
                json: function(titles, prefix) {
                    if (titles && Array.isArray(prefix)) {
                        var temp = prefix;
                        prefix = titles;
                        titles = temp;
                    }

                    if (titles && !Array.isArray(titles)) {
                        titles = [titles];
                    }

                    if (!Array.isArray(titles)) {
                        return $.when();
                    }

                    var promise = $.Deferred();
                    var pending = [];

                    for (var i = 0; i < titles.length; i++) {
                        if (prefix) {
                            titles[i] = prefix + '.' + titles[i];
                        }

                        if (!pendingJSON[titles[i]] || (pendingJSON[titles[i]] && pendingJSON[titles[i]].state() === 'rejected')) {
                            pendingJSON[titles[i]] = $.getJSON(ns.raw(titles[i], 'json'));
                        }
                        pending.push(pendingJSON[titles[i]]);
                    }

                    var self = this;
                    $.when.apply(this, pending).done(function() {
                        var loadedJSON = [];
                        for (var i = 0; i < titles.length; i++) {
                            if (arguments[i][2] && arguments[i][2].responseJSON ) {
                                loadedJSON.push(arguments[i][0]);
                            } else {
                                loadedJSON.push(arguments[i]);
                            }
                        }

                        promise.resolve({
                            modules: loadedJSON
                        });
                    }).fail(function() {
                        promise.reject.apply(this, arguments);
                    });

                    return promise;
                },
                jsonBundle: function(template, prefix) {
                    if (template && typeof(prefix) === 'object') {
                        var temp = prefix;
                        prefix = template;
                        template = temp;
                    }

                    var promise = $.Deferred();
                    var keys = [];
                    var pending = [];

                    for (var key in template) {
                        var title = template[key];
                        if (prefix) {
                            title = prefix + '.' + title;
                        }

                        if (!pendingJSON[title] || (pendingJSON[title] && pendingJSON[title].state() === 'rejected')) {
                            pendingJSON[title] = $.getJSON(ns.raw(title, 'json'));
                        }
                        keys.push(key);
                        pending.push(pendingJSON[title]);
                    }

                    var self = this;
                    $.when.apply(this, pending).done(function() {
                        var loadedJSON = {};
                        for (var i = 0; i < keys.length; i++) {
                            if (arguments[i][2] && arguments[i][2].responseJSON ) {
                                loadedJSON[keys[i]] = arguments[i][0];
                            } else {
                                loadedJSON[keys[i]] = arguments[i];
                            }
                        }

                        promise.resolve({
                            modules: loadedJSON
                        });
                    }).fail(function() {
                        promise.reject.apply(this, arguments);
                    });

                    return promise;
                },
                register: function(files) {
                    Object.assign(preload, files);
                },
                require: function(titles, prefix) {
                    if (titles && Array.isArray(prefix)) {
                        var temp = prefix;
                        prefix = titles;
                        titles = temp;
                    }

                    if (titles && !Array.isArray(titles)) {
                        titles = [titles];
                    }

                    if (!Array.isArray(titles)) {
                        return $.when();
                    }

                    var promise = $.Deferred().fail(function() {
                        console.error(arguments)
                    });
                    var pending = [];

                    for (var i = 0; i < titles.length; i++) {
                        if (prefix) {
                            titles[i] = prefix + '.' + titles[i];
                        }

                        if (!unresolved[titles[i]]) {
                            var title = titles[i];
                            unresolved[titles[i]] = $.Deferred().done(function() {
                                if (debug) {
                                    console.log('SUCCESS LOADING: ' + title);
                                }
                            }).fail(function() {
                                if (debug) {
                                    console.log('ERROR LOADING: ' + title);
                                }
                            });

                            var url = ns.js(title);
                            if (preload[title]) {
                                preload[title]();
                                pending.push($.when().done(function() {
                                    console.info('Module ' + url + ' initialized from preload.');
                                    loadedModules.push(url);
                                }));
                            } else {
                                pending.push(this.js(titles[i]).fail(unresolved[titles[i]].reject));
                            }
                            if (debug) {
                                console.log('BEGIN LOADING: ' + titles[i]);
                            }
                        }
                        pending.push(unresolved[titles[i]]);
                    }

                    var self = this;
                    $.when.apply(this, pending).done(function() {
                        var loadedModules = [];
                        for (var i = 0; i < titles.length; i++) {
                            loadedModules.push(self.modules(titles[i]));
                        }

                        promise.resolve({
                            modules: loadedModules
                        });
                    }).fail(function() {
                        promise.reject.apply(this, arguments);
                    });

                    return promise;
                },
                html: function(title, path, $container) {
                    path = path || ('/hub/html/' + title + '.html');
                    $container = $container || $('#app-' + title);

                    var promise = $.Deferred();
                    $container.load(ns.html(path), function(resp, status) {
                        if (status === 'success') {
                            promise.resolve($container);
                        } else {
                            console.error('Unable to load ' + path);
                            promise.reject(resp);
                        }
                    });
                    return promise;
                },
                iframe: function(app, url, $container) {
                    var promise = $.Deferred();
                    window.dynCore.require('lib.iframeScaling').done(function() {
                        $element = $('<iframe/>', {
                            src: url,
                            frameborder: 0,
                            scrolling: 'no',
                            width: '100%'
                        }).on('load', function() { modules.lib.iframeScaling(this, true); });

                        $container.append($element);

                        promise.resolve($element);
                    });
                    return promise;
                },
                loadTemplate: function(name, path) {
                    if (!name) {
                        return $.when();
                    }

                    if (typeof(name) !== 'object') {
                        var obj = {};
                        obj[name] = path;
                        name = obj;
                    }

                    var promises = [];

                    for (let key in name) {
                        if (templates[key]) {
                            if (!templateNotified[key]) {
                                console.warn('Template ' + key + ' already loaded.');
                                templateNotified[key] = true;
                            }
                            promises.push($.when());
                            continue;
                        }
                        promises.push(
                            $.get(name[key] || (key + '.html')).done(function(resp){
                                console.info('Template ' + key + ' loaded.');
                                templates[key] = $(resp);
                            })
                        );
                    }

                    return $.when.apply(this, promises);
                },
                makeFragment: function(name, args) {
                    if (!args) {
                        return templates[name].clone();
                    }

                    if (!Array.isArray(args)) {
                        args = [args];
                    }

                    var result = [];

                    for (var i = 0; args && i < args.length; i++) {
                        var element = templates[name].clone()[0];

                        for (var selector in args[i]) {
                            var props = args[i][selector];
                            var innerElement;
                            if (selector === '') {
                                innerElement = $(element);
                            } else {
                                innerElement = $(element).find(selector);
                            }
                            for (var prop in props) {
                                if (prop === 'text') {
                                    innerElement.text(props[prop]);
                                } else if (prop === 'on') {
                                    if (!Array.isArray(props[prop])) {
                                        props[prop] = [props[prop]];
                                    }

                                    for (var i = 0; i < props[prop].length; i++) {
                                        var event = props[prop][i];
                                        innerElement.on(event.event, event.fn);
                                    }
                                } else if (prop === 'style' || prop.split('-')[0] === 'data') {
                                    innerElement.attr(prop, props[prop]);
                                } else {
                                    innerElement.prop(prop, props[prop]);
                                }
                            }
                        }

                        result.push(element);
                    }

                    return $(result);
                },
                css: function(app, paths) {
                    if (!Array.isArray(paths)) {
                        paths = [paths];
                    }

                    for (var i = 0; i < paths.length; i++) {
                        $('head').append(
                            $('<link/>', {
                                href: ns.css(paths[i]),
                                rel: 'stylesheet',
                                'data-app': app
                            })
                        );
                    }
                    return $.when();
                },
                favicon: function(filepath) {
                    $('#favicon').remove();
                    $('head').append(
                        $('<link/>', {
                            id: 'favicon',
                            href: filepath || window.dynCore.getResource('url') + '/favicon.ico',
                            rel: 'icon'
                        })
                    );
                }
            });

            var preloads = [];
            var preloadNamespaces = $this.data('preload');
            if (typeof(preloadNamespaces) === 'undefined') {
                ready.resolve(modules);
            } else {
                if (!Array.isArray(preloadNamespaces)) {
                    preloadNamespaces = [];
                    console.warn('dynCore-data-preload is not a valid JSON array.');
                }
                for (var i = 0; i < preloadNamespaces.length; i++) {
                    preloads.push(getScript(ns.minjs(preloadNamespaces[i] + ".preload")));
                }
                $.when.apply(this, preloads).always(() => {
                    ready.resolve(modules);
                });
            }
        });
    });
})();