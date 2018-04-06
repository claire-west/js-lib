(function(dynCore) {
    dynCore.declare('lib.messageBox', [
        dynCore.require('lib', [ 
            'fragment',
            'model',
            'bind',
            'globalModel'
        ])
    ], function(modules, fragment, model, bind, globalModel) {
        var dialog;
        var model = model({}, globalModel);
        var getDialog = function() {
            dialog = dialog || fragment.get('lib.html.messageBox');
            return dialog;
        };

        getDialog().done(function(frag) {
            bind(frag, model);
            $('body').append(frag);
            frag.foundation();
            frag.on('closed.zf.reveal', function() {
                model._set('title', '');
                model._set('message', '');
            });
        });

        var show = function(title, message) {
            getDialog().done(function(frag) {
                model._set('title', title);
                model._set('message', message);
                frag.foundation('open');
            });
        };

        globalModel._set('lib.messageBox', function(e, title, message) {
            show(title, message);
        });

        return show;
    });
})(window.dynCore);