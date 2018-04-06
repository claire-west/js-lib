(function(dynCore) {
    dynCore.declare('lib.yearFooter',
        dynCore.loadTemplate('yearFooter', dynCore.modules('core.namespace').get('lib') + '/html/yearFooter.html'),
        function() {
            return dynCore.makeFragment('yearFooter', {
                '.footerYear': {
                    text: new Date().getFullYear()
                }
            }).appendTo($('.off-canvas-content'));
        }
    );
})(window.dynCore);