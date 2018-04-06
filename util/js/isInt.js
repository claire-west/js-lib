(function(dynCore) {
    dynCore.declare('lib.isInt', function() {
        return function(value) {
            return !isNaN(value) && 
                parseInt(Number(value)) == value && 
                !isNaN(parseInt(value, 10));
        };
    });
})(window.dynCore);