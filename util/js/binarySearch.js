(function(dynCore) {
    dynCore.declare('lib.binarySearch', function() {
        function compare(a, b) {
            if (typeof a === 'string' || typeof b === 'string') {
                return a.localeCompare(b);
            }
            return a - b;
        };

        // http://stackoverflow.com/a/29018745/7520417
        function binarySearch(ar, el, compare_fn = compare) {
            var m = 0;
            var n = ar.length - 1;
            while (m <= n) {
                var k = (n + m) >> 1;
                var cmp = compare_fn(el, ar[k]);
                if (cmp > 0) {
                    m = k + 1;
                } else if(cmp < 0) {
                    n = k - 1;
                } else {
                    return k;
                }
            }
            return ~m;
        };

        binarySearch.includes = function(ar, el, compare_fn) {
            return binarySearch(ar, el, compare_fn) > -1;
        };

        return binarySearch;
    });
})(window.dynCore);