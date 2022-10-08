(function(dynCore) {
    dynCore.declare('lib.centralAuth', dynCore.require('lib.cors'), function(modules) {
        var nodeURL = dynCore.getResource('node');
        var cors = modules.lib.cors;
        var events = {};
        var initialized;
        var centralAuth = {
            google: {
                signIn: function(googleUser) {
                    var promise = $.Deferred();
                    var profile = googleUser.getBasicProfile();
                    var name = profile.getName();
                    var idToken = googleUser.getAuthResponse().id_token;
                    console.info('Google user ' + name + ' signed in.');
                    centralAuth.google.info = {
                        id: profile.getId(),
                        name: name,
                        imgUrl: profile.getImageUrl(),
                        email: profile.getEmail(),
                        token: idToken
                    };

                    cors({
                        url: nodeURL + '/login',
                        method: 'POST',
                        contentType: 'text/plain',
                        data: idToken
                    }).done(function(info) {
                        if (events.signIn) {
                            for (var i = 0; i < events.signIn.length; i++) {
                                events.signIn[i].call(this, info);
                            }
                        }
                        $('.g-signin2').hide();
                        promise.resolve(info);
                    });

                    return promise;
                },
                signOut: function() {
                    var auth2 = window.gapi.auth2.getAuthInstance();
                    return auth2.signOut().then(function() {
                        console.warn('Google user signed out.');
                        delete centralAuth.google.info;

                        cors(nodeURL + '/logout').always(function() {
                            if (events.signOut) {
                                for (var i = 0; i < events.signOut.length; i++) {
                                    events.signOut[i].call(this);
                                }
                            }
                            $('.g-signin2').show();
                        });
                    });
                },
                on: function(event, fn) {
                    if (event && fn) {
                        events[event] = events[event] || [];
                        events[event].push(fn);
                    }
                    return centralAuth.google;
                },
                off: function(event, fn) {
                    if (event) {
                        if (fn) {
                            for (var i = 0; i < events[event].length; i++) {
                                if (events[event][i] === fn) {
                                    events[event].splice(i);
                                    break;
                                }
                            }

                        } else {
                            delete events[event];
                        }
                    }
                    return centralAuth.google;
                },
                baseHeaders: function() {
                    if (!centralAuth.google.info) {
                        return {};
                    }
                    return {
                        user: centralAuth.google.info.id,
                        auth: centralAuth.google.info.token
                    };
                },
                makeButton: function() {
                    return $('<div/>', {
                        class: 'g-signin2'
                    }).attr('data-onsuccess', 'googleSignIn')
                },
                // sign in buttons must be created before the api is loaded
                init: function() {
                    if (initialized) {
                        return initialized;
                    }
                    initialized = $.Deferred();

                    $('head').append(
                        $('<meta/>', {
                            name: 'google-signin-client_id',
                            content: '339434083152-h4kch5acolo1o3s0t9lg7pm3am6e14qr.apps.googleusercontent.com'
                        })
                    );
                    dynCore.js('https://apis.google.com/js/platform.js').done(function() {
                        initialized.resolve();
                    }).fail(function() {
                        initialized.reject();
                        initialized = null;
                    });

                    return initialized;
                }
            }
        };

        window.googleSignIn = centralAuth.google.signIn;
        return centralAuth;
    });
})(window.dynCore);