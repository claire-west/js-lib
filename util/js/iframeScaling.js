(function(dynCore) {
    dynCore.declare('lib.iframeScaling', function() {
        var scaleIframe = function(element, maintain) {
            element.style.height = element.contentWindow.document.body.scrollHeight + 'px';

            if (maintain) {
                setTimeout(function() {
                    scaleIframe(element, maintain);
                }, 100);
            }
        };
        return scaleIframe;
    });
})(window.dynCore);