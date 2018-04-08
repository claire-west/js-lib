(function(dynCore) {
    dynCore.declare('lib.isMobile', function() {
        var isMobile = /Mobi/i.test(navigator.userAgent);
        var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints

        if (isMobile) {
            $('body').addClass('mobile');
        }

        if (isTouch) {
            $('body').addClass('touch');
        }

        return function() {
            return isMobile || isTouch;
        };
    });
})(window.dynCore);