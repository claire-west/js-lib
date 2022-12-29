(function(dynCore) {
    dynCore.declare('lib.hashlessApp', [
        dynCore.require('lib', [
            'hashlessNav',
            'bind',
            'model',
            'globalModel',
        ])
    ], function(modules, nav, bind, model, globalModel) {
        var baseApp = {
            create: function(app, requiredModules) {
                var self = Object.create(this);
                var promise = $.Deferred();
                Object.assign(self, app);
                self.model = model(app.model, globalModel);

                nav.bindNavApp(function(app, section, args) {
                    if (app === self.title) {
                        globalModel._set('@app', app);
                        if (self.onNavTo) {
                            self.onNavTo.apply(self, arguments);
                        }
                    }
                });

                nav.bindNavSection(function(app, section, args) {
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
                nav.bindExitApp(function(app) {
                    if (app === self.title && self.onExit) {
                        self.onExit.call(self);
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
                    promise.resolve(self);
                });

                return promise;
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
                baseApp.create(app).done(function(app) {
                    promise.resolve(app);
                });
            }).fail(function() {
                promise.reject();
            })

            return promise;
        };
    });
})(window.dynCore);