(function(dynCore) {
    dynCore.declare('lib.ajaxLoader',
        dynCore.loadTemplate('ajaxLoader', dynCore.modules('core.namespace').get('lib') + '/html/ajaxLoader.html'),
        function() {
            return function(promise, $container, text) {
                var $elements = $container.find('*').filter(':visible').hide();
                var $ajaxLoader = dynCore.makeFragment('ajaxLoader', {
                    'span': {
                        text: (text || 'Loading') + ' '
                    }
                }).prependTo($container);
                return promise.always(function() {
                    $ajaxLoader.remove();
                    $elements.show();
                });
            };
        }
    );
})(window.dynCore);