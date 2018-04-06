(function(dynCore) {
    dynCore.declare('lib.ajaxError',
        dynCore.loadTemplate('ajaxError', dynCore.modules('core.namespace').get('lib') + '/html/ajaxError.html'),
        function() {
            return function($container, fnRetry) {
                var $elements = $container.find('*').filter(':visible').hide();
                $container.prepend(
                    dynCore.makeFragment('ajaxError', {
                        '.ajaxRetry': {
                            on: [
                                {
                                    event: 'click',
                                    fn: function() {
                                        $(this).parent().remove();
                                        $elements.show();
                                    }
                                },
                                {
                                    event: 'click',
                                    fn: fnRetry
                                }
                            ]
                        }
                    })
                );
            };
        }
    );
})(window.dynCore);