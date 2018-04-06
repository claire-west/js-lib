(function(dynCore) {
    dynCore.declare('lib.baseApp', [
        dynCore.require('lib', [
            'hashNav',
            'centralAuth',
            'model',
            'globalModel',
            'bind',
            'scrollDown'
        ])
    ], function(modules, hashNav, centralAuth, model, globalModel, bind, scrollDown) {
        var baseApp = {
            create: function(app, requiredModules) {
                var self = Object.create(this);
                Object.assign(self, app);
                self.model = model(app.model, globalModel);

                hashNav.bindNavApp(function(app, section, args) {
                    if (app === self.title) {
                        globalModel._set('@app', app);
                        if (self.onNavTo) {
                            self.onNavTo.apply(self, arguments);
                        }
                    }
                });

                hashNav.bindNavSection(function(app, section, args) {
                    if (app === self.title) {
                        section = section || '';
                        var from = self.model._get('@section');
                        self.model._set('@section', section);

                        if (self.onChangeSection && section !== from) {
                            self.onChangeSection.call(self, section, from);
                        }
                        if (self.onNav && self.onNav[section]) {
                            self.onNav[section].apply(self, args);
                        }
                        if (self.model && self.model.onNav && self.model.onNav[section]) {
                            self.model.onNav[section].apply(self, args);
                        }
                    }
                });
                hashNav.bindExitApp(function(app) {
                    if (app === self.title && self.onExit) {
                        self.onExit.call(self);
                    }
                });

                centralAuth.google.on('signIn', function() {
                    if (self.onSignIn) {
                        self.onSignIn.apply(self, arguments);
                    }
                });
                centralAuth.google.on('signOut', function() {
                    if (self.onSignOut) {
                        self.onSignOut.apply(self, arguments);
                    }
                });

                scrollDown.on(50, function() {
                    if (self.onScrollDown) {
                        self.onScrollDown.apply(self, arguments);
                    }
                });

                if (self.onInit) {
                    self.onInit.call(self, modules);
                }

                var $lazy = self.find('section.contentSection[z--lazy]');
                for (var i = 0; i < $lazy.length; i++) {
                    var $this = $($lazy[i]);
                    if ($this.attr('z--lazy') === '') {
                        var section = $lazy[i].id.split('-')[1] || '';
                        $this.attr('z--lazy', JSON.stringify({
                            path: '@section',
                            eq: section
                        }));
                    }
                }

                bind(self.$app, self.model).done(function() {
                    self.model._refresh();
                });

                return self;
            },

            getPath: function(object) {
                return this.namespace + '.' + object;
            },

            find: function(selector) {
                return this.$app.find(selector);
            }
        };

        return function(args) {
            var promise = $.Deferred();

            var app = args.app || {};
            app.title = args.title;
            app.namespace = args.namespace || '';
            app.$app = args.$app;

            dynCore.when(
                dynCore.css(app.title, app.css || app.namespace + '.' + app.title),
                dynCore.html(app.title, app.html || app.namespace + '.' + app.title, app.$app)
            ).done(function(modules) {
                promise.resolve(baseApp.create(app));
            }).fail(function() {
                promise.reject();
            })

            return promise;
        };
    });
})(window.dynCore);