(function(dynCore) {
    dynCore.declare('lib.hashNav', function() {
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

        var getHash = function(app, section, args) {
            var hash = '#' + app + '-' + section;
            if (args) {
                if (!Array.isArray(args)) {
                    args = [args];
                }
                hash += '/' + args.join('/');
            }
            return hash;
        };

        var hashNav = {
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
                window.location.hash = getHash.apply(this, arguments);
            },
            navReplace: function() {
                window.location.replace(getHash.apply(this, arguments));
            },
            rehash: function(force) {
                var hashParts = window.location.hash.split('/');
                var route = hashParts[0].split('-');

                var app = route[0].substring(1)
                var section = route[1];
                var navArgs = hashParts.splice(1);

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
            }
        };

        $(window).on('hashchange', hashNav.rehash);
        return window.hashNav = hashNav;
    });
})(window.dynCore);