(function(dynCore) {
    dynCore.declare('lib.model', dynCore.require('lib.propGet'), function(modules, propGet) {
        var model = {
            _set: function(path, value) {
                propGet.set(this, path, value);
                this._refresh();
            },

            _get: function(path) {
                if (typeof(path) === 'undefined') {
                    return this;
                }
                return propGet.get(this, path);
            },

            _trackers: [],

            _track: function(exp, handler) {
                var fn = exp;
                if (typeof(exp) === 'string') {
                    var self = this;
                    fn = function() {
                        return self._get(exp);
                    };
                }
                this._trackers.push({
                    fn: fn,
                    handler: handler
                });
            },

            _refresh: function() {
                var dirty;
                do {
                    dirty = false;
                    for (var i = 0; i < this._trackers.length; i++) {
                        var newVal = this._trackers[i].fn();
                        var oldVal = this._trackers[i].prev;

                        // Used to be array, now isn't
                        if (!Array.isArray(newVal) && Array.isArray(oldVal) && oldVal.length) {
                            var dummy = [];
                            oldVal = oldVal.filter(function(item) {
                                return typeof(item) !== 'undefined';
                            });
                            for (var n = 0; n < oldVal.length; n++) {
                                this._trackers[i].handler.call(this, newVal, oldVal[n], n);
                                this._trackers[i].prev[n] = dummy[n];
                            }
                            dirty = true;
                        }

                        // Is currently an array
                        if (Array.isArray(newVal)) {
                            if (Array.isArray(oldVal)) {
                                oldVal = oldVal.filter(function(item) {
                                    return typeof(item) !== 'undefined';
                                });
                            } else {
                                oldVal = this._trackers[i].prev = [];
                            }
                            if (newVal.length !== oldVal.length) {
                                var startIndex = Math.min(newVal.length, oldVal.length);
                                for (var n = startIndex; n < newVal.length || n < oldVal.length; n++) {
                                    this._trackers[i].handler.call(this, newVal, oldVal[n], n);
                                    this._trackers[i].prev[n] = newVal[n];
                                }
                                dirty = true;
                            }
                        } else if (oldVal !== newVal) { // Not an array, but the value has changed
                            this._trackers[i].handler.call(this, newVal, oldVal);
                            this._trackers[i].prev = newVal;
                            dirty = true;
                        } else if (typeof(newVal) === 'undefined' && !this._trackers[i].initialized) {
                            // Always run the handler at least once in case both
                            // old and new are undefined when _track is called
                            this._trackers[i].handler.call(this, newVal, oldVal);
                            this._trackers[i].initialized = true;
                        }
                    }
                } while (dirty);
            },

            _children: [],

            _fullRefresh: function(seen) {
                seen = seen || [];
                if (seen.includes(this)) {
                    return;
                }

                this._refresh();
                seen.push(this);

                var parent = this._parent;
                if (parent) {
                    parent._fullRefresh(seen);
                }

                for (var i = 0; i < this._children.length; i++) {
                    this._children[i]._fullRefresh(seen);
                }
            }
        };

        return function(data, parent) {
            var self = Object.create(model);
            self._parent = parent;
            if (parent) {
                parent._children.push(self);
            }
            if (typeof(data) === 'object' && !Array.isArray(data)) {
                Object.assign(self, data);
            }
            return self;
        };
    });
})(window.dynCore);