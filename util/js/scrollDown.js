(function(dynCore) {
    dynCore.declare('lib.scrollDown', function() {
        var events = [];

        $('.off-canvas-wrapper').on('scroll', function() {
            var distance = this.scrollHeight - ( this.scrollTop + this.offsetHeight );
            for (var i = 0; i < events.length; i++) {
                if ((events[i].percent && distance <= events[i].threshold * this.scrollHeight) ||
                    (!events[i].percent && distance <= events[i].threshold)) {
                    events[i].fn();
                }
            }
        });

        return {
            on: function(threshold, fn) {
                var percent = false;
                if (typeof(fn) === 'undefined') {
                    fn = threshold;
                    threshold = 0.1;
                    percent = true;
                } else if (isNaN(Number(threshold))) {
                    if (typeof(threshold) === 'string' && threshold[threshold.length - 1] === "%") {
                        threshold = Number(threshold.splice(0, -1)) / 100;
                        percent = true;
                        if (isNaN(threshold)) {
                            throw 'invalid threshold';
                        }
                    } else {
                        throw 'invalid threshold';
                    }
                }

                events.push({
                    fn: fn,
                    threshold: threshold,
                    percent: percent
                });
            },

            off: function(fn) {
                events.splice(events.indexOf(fn), 1);
            }
        }
    });
})(window.dynCore);