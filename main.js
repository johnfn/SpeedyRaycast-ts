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
    // distance^2 to other
    Vertex.prototype.dist2 = function (other) {
        return (this.x - other.x) * (this.x - other.x) +
            (this.y - other.y) * (this.y - other.y);
    };
    return Vertex;
})();
var Box = (function () {
    function Box(x, y, width, height, isPlayer) {
        if (isPlayer === void 0) { isPlayer = false; }
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isPlayer = isPlayer;
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
        return new Vertex(this.x + this.width / 2, this.y + this.height / 2);
    };
    Box.prototype.contains = function (v, checkForPlayerToo) {
        if (checkForPlayerToo === void 0) { checkForPlayerToo = false; }
        if (this.isPlayer && !checkForPlayerToo)
            return false;
        return v.x >= this.x && v.x <= this.x + this.width &&
            v.y >= this.y && v.y <= this.y + this.height;
    };
    return Box;
})();
var canvas;
var context;
var character = new Box(200, 200, 30, 30, true);
var mapBoundary = [
    new Vertex(0, 0),
    new Vertex(500, 0),
    new Vertex(500, 500),
    new Vertex(0, 500)
];
var objects = [new Box(50, 50, 80, 80), character];
var objectEdges = objects
    .map(function (box) { return box.vertices(); })
    .filter(function (val) { return val.length != 0; });
function almost(x, y) {
    return Math.abs(x - y) < .0001;
}
function drawLine(start, end, color, dashed) {
    if (color === void 0) { color = "$000"; }
    if (dashed === void 0) { dashed = false; }
    context.strokeStyle = color;
    context.beginPath();
    if (dashed) {
        // Dashed lines don't work in IE<11?? All my hopes are dashed! (TODO)
        context.setLineDash([2, 3]);
    }
    else {
        context.setLineDash([]);
    }
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
}
function start() {
    canvas = document.getElementById("main");
    context = canvas.getContext('2d');
    setUpListeners();
    requestAnimationFrame(renderScene);
}
function setUpListeners() {
    var selectedThing = null;
    canvas.addEventListener("mousedown", function (ev) {
        var point = new Vertex(ev.offsetX, ev.offsetY);
        for (var _i = 0; _i < objects.length; _i++) {
            var obj = objects[_i];
            if (obj.contains(point, true)) {
                selectedThing = obj;
            }
        }
    });
    canvas.addEventListener("mousemove", function (ev) {
        if (selectedThing != null && !outOfBounds(new Vertex(ev.offsetX, ev.offsetY))) {
            selectedThing.x = ev.offsetX;
            selectedThing.y = ev.offsetY;
        }
    });
    canvas.addEventListener("mouseup", function (ev) {
        selectedThing = null;
    });
}
function renderScene() {
    context.clearRect(0, 0, 500, 500);
    drawItems();
    drawLOSRays();
    drawCharacter();
    requestAnimationFrame(renderScene);
}
function drawItems() {
    for (var _i = 0; _i < objectEdges.length; _i++) {
        var list = objectEdges[_i];
        context.fillStyle = '#000';
        context.beginPath();
        context.moveTo(list[0].x, list[0].y);
        for (var _a = 0; _a < list.length; _a++) {
            var vertex = list[_a];
            context.lineTo(vertex.x, vertex.y);
        }
        context.closePath();
        context.fill();
    }
}
function drawCharacter() {
    var center = character.center();
    context.beginPath();
    context.arc(center.x, center.y, 20, 0, 2 * Math.PI, false);
    context.fillStyle = 'lightgray';
    context.fill();
}
function outOfBounds(v) {
    return v.x < 0 || v.x > 500 || v.y < 0 || v.y > 500;
}
// Raycast from start in the direction of secondPoint. If keepGoing, then potentially continue to
// raycast past that point.
function raycast(start, secondPoint, keepGoing) {
    if (keepGoing === void 0) { keepGoing = false; }
    var direction = new Vertex(secondPoint.x - start.x, secondPoint.y - start.y);
    var magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    var normalizedDirection = new Vertex(direction.x / magnitude, direction.y / magnitude);
    var currentPosition = start.clone();
    while (keepGoing || (!keepGoing && start.dist2(secondPoint) > start.dist2(currentPosition))) {
        currentPosition = new Vertex(currentPosition.x + normalizedDirection.x, currentPosition.y + normalizedDirection.y);
        if (outOfBounds(currentPosition)) {
            return currentPosition;
        }
        for (var _i = 0; _i < objects.length; _i++) {
            var box = objects[_i];
            if (box.contains(currentPosition)) {
                return currentPosition;
            }
        }
    }
    return secondPoint;
}
function drawLOSRays() {
    var allVertices = [];
    var origin = character.center();
    for (var _i = 0; _i < objectEdges.length; _i++) {
        var path = objectEdges[_i];
        for (var _a = 0; _a < path.length; _a++) {
            var vertex = path[_a];
            allVertices.push(vertex);
        }
    }
    for (var _b = 0; _b < mapBoundary.length; _b++) {
        var vertex = mapBoundary[_b];
        allVertices.push(vertex);
    }
    for (var _c = 0; _c < allVertices.length; _c++) {
        var vertex = allVertices[_c];
        var raycastEnd = raycast(origin, vertex, true);
        if (origin.dist2(raycastEnd) < origin.dist2(vertex)) {
            continue;
        }
        if (raycastEnd.eq(vertex)) {
            drawLine(origin, raycastEnd, "gray");
        }
        else {
            drawLine(origin, vertex, "gray");
            drawLine(vertex, raycastEnd, "gray", true);
        }
    }
}
document.addEventListener("DOMContentLoaded", function (event) {
    start();
});
