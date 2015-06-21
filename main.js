/// <reference path="defs.d.ts" />
(function () {
    var canvas;
    var context;
    var character = new Box(300, 300, 30, 30, true);
    var mapBoundary = [
        new Vertex(0, 0),
        new Vertex(500, 0),
        new Vertex(500, 500),
        new Vertex(0, 500)
    ];
    var objects = [new Box(150, 150, 80, 80), character];
    function objectEdges() {
        return objects
            .map(function (box) { return box.vertices(); })
            .filter(function (val) { return val.length != 0; });
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
        for (var _i = 0, _a = objectEdges(); _i < _a.length; _i++) {
            var list = _a[_i];
            context.fillStyle = '#000';
            context.beginPath();
            context.moveTo(list[0].x, list[0].y);
            for (var _b = 0; _b < list.length; _b++) {
                var vertex = list[_b];
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
    function drawLOSRays() {
        var allVertices = [];
        var origin = character.center();
        for (var _i = 0, _a = objectEdges(); _i < _a.length; _i++) {
            var path = _a[_i];
            for (var _b = 0; _b < path.length; _b++) {
                var vertex = path[_b];
                allVertices.push(vertex);
            }
        }
        for (var _c = 0; _c < mapBoundary.length; _c++) {
            var vertex = mapBoundary[_c];
            allVertices.push(vertex);
        }
        for (var _d = 0; _d < allVertices.length; _d++) {
            var vertex = allVertices[_d];
            var raycastEnd = raycast(origin, vertex, objects, true);
            if (origin.dist2(raycastEnd) < origin.dist2(vertex)) {
                continue;
            }
            if (raycastEnd.eq(vertex)) {
                drawLine(context, origin, raycastEnd, "gray");
                raycastEnd.draw(context);
            }
            else {
                drawLine(context, origin, vertex, "gray");
                drawLine(context, vertex, raycastEnd, "gray", true);
                vertex.draw(context);
                raycastEnd.draw(context);
            }
        }
    }
    document.addEventListener("DOMContentLoaded", function (event) {
        start();
    });
})();
//# sourceMappingURL=main.js.map