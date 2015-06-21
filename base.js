;
var fileCache = {};
function prop(target, name) {
    Object.defineProperty(target, name, {
        get: function () { return this["_" + name]; },
        set: function (value) { this["_" + name] = value; },
        enumerable: true,
        configurable: true
    });
}
function validatedProp(validate) {
    return function _prop(target, name) {
        Object.defineProperty(target, name, {
            get: function () { return this["_" + name]; },
            set: function (value) {
                if (validate(value)) {
                    this["_" + name] = value;
                }
                else {
                    console.error("Invalid value " + value + ".");
                }
            },
            enumerable: true,
            configurable: true
        });
    };
}
function filter(list, callback) {
    var result = [];
    var len = list.length;
    for (var i = 0; i < len; i++) {
        if (callback(list[i])) {
            result.push(list[i]);
        }
    }
    return result;
}
function isFunction(obj) {
    return typeof obj == 'function' || false;
}
var Maybe = (function () {
    function Maybe(value) {
        if (value === void 0) { value = undefined; }
        this.hasValue = false;
        this.value = value;
    }
    Object.defineProperty(Maybe.prototype, "value", {
        get: function () {
            if (this.hasValue) {
                return this._value;
            }
            console.error("asked for value of Maybe without a value");
        },
        set: function (value) {
            this._value = value;
            this.hasValue = value !== undefined;
        },
        enumerable: true,
        configurable: true
    });
    return Maybe;
})();
var Ambrosia = (function () {
    function Ambrosia() {
        this.listeners = {};
        this._props = undefined;
        var proto = Object.getPrototypeOf(this);
        while (proto.constructor !== Ambrosia && !Ambrosia.overridden[Ambrosia.fullyQualifiedName(proto)]) {
            this.overrideProperties(proto);
            proto = Object.getPrototypeOf(proto);
        }
        this.bindEverything();
    }
    Ambrosia.fullyQualifiedName = function (proto) {
        var names = [];
        while (proto.constructor !== Ambrosia) {
            names.push(proto.constructor.name);
            proto = Object.getPrototypeOf(proto);
        }
        return names.join("#");
    };
    Ambrosia.prototype.hasGetterAndSetter = function (proto, name) {
        var pd = Object.getOwnPropertyDescriptor(proto, name);
        return pd != undefined && pd.get != undefined;
    };
    Ambrosia.prototype.props = function () {
        var _this = this;
        if (this._props === undefined) {
            var proto = Object.getPrototypeOf(this);
            this._props = [];
            while (proto.constructor !== Ambrosia) {
                var networkProps = filter(Object.getOwnPropertyNames(proto), function (name) { return _this.hasGetterAndSetter(proto, name); });
                this._props = this._props.concat(networkProps);
                proto = Object.getPrototypeOf(proto);
            }
        }
        return this._props;
    };
    Ambrosia.prototype.overrideProperties = function (proto) {
        Ambrosia.overridden[Ambrosia.fullyQualifiedName(proto)] = true;
        for (var accessorName in this) {
            var pd = Object.getOwnPropertyDescriptor(proto, accessorName);
            if (pd && pd.get) {
                this.overrideSetterGetter(pd, accessorName, proto);
            }
        }
    };
    Ambrosia.prototype.toJSON = function () {
        var result = {};
        var props = this.props();
        for (var i = 0; i < props.length; i++) {
            var key = props[i];
            var val = this[key];
            result[key] = val;
        }
        return result;
    };
    Ambrosia.prototype.bindEverything = function () {
        var fns = [];
        for (var prop in this) {
            if (!this.hasGetterAndSetter(Object.getPrototypeOf(this), prop) && isFunction(this[prop]) && !(prop in Ambrosia.prototype)) {
                fns.push(prop);
            }
        }
        if (fns.length > 0) {
            for (var i = 0; i < fns.length; i++) {
                this[fns[i]] = this[fns[i]].bind(this);
            }
        }
    };
    Ambrosia.prototype.overrideSetterGetter = function (pd, accessorName, proto) {
        // overrwrite property getters with our own
        var oldValue;
        var hasSetOldValue = false;
        Object.defineProperty(proto, accessorName, {
            get: pd.get,
            set: function (val) {
                var differentValue = !hasSetOldValue || val != oldValue;
                oldValue = val;
                pd.set.bind(this)(val);
                this.trigger('change');
                this.trigger('change:' + accessorName);
                this.trigger('change:' + accessorName + ':' + val);
                if (differentValue) {
                    this.trigger('change-different');
                    this.trigger('change-different:' + accessorName);
                    this.trigger('change-different:' + accessorName + ':' + val);
                }
                hasSetOldValue = true;
            },
            enumerable: true,
            configurable: true
        });
    };
    Ambrosia.prototype.trigger = function (eventName) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var listenerList = this.listeners[eventName];
        if (!listenerList)
            return;
        for (var i = 0; i < listenerList.length; i++) {
            listenerList[i].apply(this, args);
        }
    };
    Ambrosia.prototype.listenToHelper = function (target, eventName, callback, once) {
        var _this = this;
        if (eventName.indexOf("&&") !== -1) {
            var split = eventName.split("&&");
            var condition = split[1];
            eventName = split[0];
        }
        var listenerList = target.listeners[eventName];
        if (!listenerList)
            target.listeners[eventName] = [];
        var removeCB;
        var modifiedCallback = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            if ((condition && target[condition]) || !condition) {
                callback.apply(_this, args);
                if (once)
                    removeCB();
            }
        };
        removeCB = function () {
            var idx = target.listeners[eventName].indexOf(modifiedCallback);
            target.listeners[eventName].splice(idx, 1);
        };
        target.listeners[eventName].push(modifiedCallback);
    };
    Ambrosia.prototype.listenTo = function (target, eventName, callback) {
        if (!target)
            throw "target doesn't exist!";
        this.listenToHelper(target, eventName, callback, false);
    };
    Ambrosia.prototype.listenToOnce = function (target, eventName, callback) {
        if (!target)
            throw "target doesn't exist!";
        this.listenToHelper(target, eventName, callback, true);
    };
    Ambrosia.overridden = {};
    return Ambrosia;
})();
//# sourceMappingURL=base.js.map