/// <reference path="defs.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
if (typeof __decorate !== "function") __decorate = function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var CANV_W = 500;
var CANV_H = 500;
var CELL_W = 50;
var CELL_H = 50;
var Vertex = (function () {
    function Vertex(x, y) {
        this.x = x;
        this.y = y;
    }
    Vertex.prototype.eq = function (other) {
        return almost(this.x, other.x) && almost(this.y, other.y);
    };
    Vertex.prototype.clone = function () {
        return new Vertex(this.x, this.y);
    };
    Vertex.prototype.dist2 = function (other) {
        return (this.x - other.x) * (this.x - other.x) +
            (this.y - other.y) * (this.y - other.y);
    };
    Vertex.prototype.draw = function (context, color, size) {
        if (color === void 0) { color = "blue"; }
        if (size === void 0) { size = 5; }
        context.beginPath();
        context.arc(this.x, this.y, size, 0, 2 * Math.PI, false);
        context.fillStyle = color;
        context.fill();
    };
    Vertex.prototype.isOnSegment = function (start, end) {
        return this.isOnLine(start, end) &&
            isWithinRange(this.x, start.x, end.x) &&
            isWithinRange(this.y, start.y, end.y);
    };
    Vertex.prototype.isOnLine = function (start, end) {
        if (Math.abs(end.x - start.x) < .001) {
            return almost(this.x, start.x);
        }
        var m = (end.y - start.y) / (end.x - start.x);
        var b = start.y - m * start.x;
        return almost(this.y, m * this.x + b);
    };
    return Vertex;
})();
var Box = (function (_super) {
    __extends(Box, _super);
    function Box(x, y, width, height, isPlayer, changecb) {
        if (isPlayer === void 0) { isPlayer = false; }
        if (changecb === void 0) { changecb = undefined; }
        _super.call(this);
        this.width = width;
        this.height = height;
        this.isPlayer = isPlayer;
        this.changecb = changecb;
        this.x = x;
        this.y = y;
    }
    Box.prototype.vertices = function () {
        // don't judge me
        var x = this.x;
        var y = this.y;
        var width = this.width;
        var height = this.height;
        if (this.isPlayer)
            return [];
        return [
            new Vertex(x, y),
            new Vertex(x + width, y),
            new Vertex(x + width, y + height),
            new Vertex(x, y + height)
        ];
    };
    Box.prototype.center = function () {
        return new Vertex(this.x, this.y);
    };
    Box.prototype.contains = function (v, checkForPlayerToo) {
        if (checkForPlayerToo === void 0) { checkForPlayerToo = false; }
        if (this.isPlayer && !checkForPlayerToo)
            return false;
        if (this.isPlayer) {
            return Math.sqrt(v.dist2(this.center())) < this.width;
        }
        else {
            return v.x > this.x && v.x < this.x + this.width &&
                v.y > this.y && v.y < this.y + this.height;
        }
    };
    Box.prototype.draw = function (context) {
        if (this.isPlayer) {
            this.drawCircle(context);
            return;
        }
        var list = this.vertices();
        context.fillStyle = '#888';
        context.beginPath();
        context.moveTo(list[0].x, list[0].y);
        for (var _i = 0; _i < list.length; _i++) {
            var vertex = list[_i];
            context.lineTo(vertex.x, vertex.y);
        }
        context.closePath();
        context.fill();
    };
    Box.prototype.drawCircle = function (context) {
        context.beginPath();
        context.arc(this.x, this.y, this.width / 2, 0, 2 * Math.PI, false);
        context.fillStyle = 'lightgray';
        context.fill();
    };
    __decorate([
        prop
    ], Box.prototype, "x");
    __decorate([
        prop
    ], Box.prototype, "y");
    return Box;
})(Ambrosia);
function outOfBounds(v) {
    return v.x < 0 || v.x > 500 || v.y < 0 || v.y > 500;
}
function almost(x, y) {
    return Math.abs(x - y) < .0001;
}
function isWithinRange(value, start, end) {
    var low = Math.min(start, end);
    var high = Math.max(start, end);
    return value >= low && value <= high;
}
function raycast(start, secondPoint, colliders, keepGoing) {
    if (keepGoing === void 0) { keepGoing = false; }
    if (start.eq(secondPoint)) {
        return undefined;
    }
    var direction = new Vertex(secondPoint.x - start.x, secondPoint.y - start.y);
    var magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    var normalizedDirection = new Vertex(direction.x / magnitude, direction.y / magnitude);
    var currentPosition = start.clone();
    while (keepGoing || (!keepGoing && start.dist2(secondPoint) > start.dist2(currentPosition))) {
        currentPosition = new Vertex(currentPosition.x + normalizedDirection.x, currentPosition.y + normalizedDirection.y);
        if (outOfBounds(currentPosition)) {
            return currentPosition;
        }
        for (var _i = 0; _i < colliders.length; _i++) {
            var box = colliders[_i];
            if (box.contains(currentPosition)) {
                return currentPosition;
            }
        }
    }
    return secondPoint;
}
function drawLine(context, start, end, color, dashed) {
    if (color === void 0) { color = "$000"; }
    if (dashed === void 0) { dashed = false; }
    context.strokeStyle = color;
    context.lineWidth = 1;
    context.beginPath();
    if (dashed) {
        context.setLineDash([2, 3]);
    }
    else {
        context.setLineDash([]);
    }
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
}
//# sourceMappingURL=util.js.map