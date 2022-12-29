(function(dynCore) {
    dynCore.declare('lib.hashlessNav', [
        dynCore.require('lib.bind')
    ], function(modules, bind) {
        var onNavApp = {};
        var onNavSection = {};
        var onExitApp = {};

        var currentApp;

        var on = function(app, fn, events) {
            if (typeof(fn) === 'undefined') {
                fn = app;
                app = '';
            }
            events[app] = events[app] || [];
            events[app].push(fn);
        };

        var off = function(app, fn, events) {
            if (typeof(fn) === 'undefined') {
                fn = app;
                app = '';
            }
            events[app].splice(events.indexOf(fn), 1);
        }

        var getPath = function(app, section, args) {
            console.log(arguments)
            var path = '/' + app;
            if (section) {
                path += '-' + section;
            }
            if (path === '/home') {
                path = '/';
            }
            if (args) {
                if (!Array.isArray(args)) {
                    args = [args];
                }
                if (args.length) {
                    path += '#' + args.join('/');
                }
            }
            return path;
        };

        var onNavClick = function(e) {
            e.preventDefault();
            var href = this.href.replace(location.origin, '');
            if (href !== window.location.pathname) {
                window.history.pushState({},'', href);
                hashlessNav.refresh();
            }
        };

        var nav = {
            bindNavApp: function(app, fn) {
                on(app, fn, onNavApp);
            },
            unbindNavApp: function(app, fn) {
                off(app, fn, onNavApp);
            },
            bindNavSection: function(app, fn) {
                on(app, fn, onNavSection);
            },
            unbindNavSection: function(app, fn) {
                off(app, fn, onNavSection);
            },
            bindExitApp: function(app, fn) {
                on(app, fn, onExitApp);
            },
            unbindExitApp: function(app, fn) {
                off(app, fn, onExitApp);
            },
            navTo: function() {
                window.history.pushState({},'', getPath.apply(this, arguments));
            },
            replace: function() {
                window.history.replaceState({},'', getPath.apply(this, arguments));
            },
            refresh: function(force) {
                var route = window.location.pathname.split('-');
                var navArgs = window.location.hash.split('/');

                var app = route[0].substring(1) || 'home';
                var section = route[1];

                if (app !== currentApp || force) {
                    var onNavAppEvents = (onNavApp[''] || []).concat(onNavApp[app] || []);
                    for (var i = 0; i < onNavAppEvents.length; i++) {
                        onNavAppEvents[i].call(this, app, route[1], navArgs);
                    }

                    // Don't fire exit event on forced refresh if app hasn't changed
                    if (app !== currentApp) {
                        var onExitAppEvents = (onExitApp[''] || []).concat(onExitApp[currentApp] || []);
                        for (var i = 0; i < onExitAppEvents.length; i++) {
                            onExitAppEvents[i].call(this, currentApp);
                        }
                    }

                    currentApp = app;
                }

                if (app) {
                    var onNavSectionEvents = onNavSection[''] || [];
                    if (section) {
                        onNavSectionEvents = onNavSectionEvents.concat(onNavSection[section] || []);
                    }
                    for (var i = 0; i < onNavSectionEvents.length; i++) {
                        onNavSectionEvents[i].call(this, app, section, navArgs);
                    }
                }
            },
            bindATags: function($element) {
                var $a = $element.find('a');
                $a.each(function(i, element) {
                    var $element = $(element);
                    // only bind local paths that are not anchor links
                    if (element.href.startsWith(window.location.origin) &&
                        !element.attributes.href.value.startsWith('#') &&
                        typeof($element.attr('z--ignore')) === 'undefined') {

                        $element.off('click', onNavClick).on('click', onNavClick);
                    }
                });
            }
        };

        bind(nav.bindATags);

        if (window.location.pathname === '/' && window.location.hash) {
            var hashParts = window.location.hash.split('/');
            var route = hashParts[0].split('-');

            var app = route[0].substring(1)
            var section = route[1];
            var navArgs = hashParts.splice(1);
            nav.replace(app, section, navArgs);
        }

        window.addEventListener('popstate', nav.refresh);
        return window.hashlessNav = nav;
    });
})(window.dynCore);