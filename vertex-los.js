// TODO
// * Highlight doubled-up vertexes with different color.
// * Vertex popping animations?
// * Don't drag character onto box?
var canvas;
var context;
var ticksSinceChange = 0;
var character = new Box(50, 50, 25, 25, true);
var objects = [
    new Box(250, 250, 50, 50, false),
    new Box(100, 100, 50, 50, false),
    new Box(100, 250, 50, 50, false),
    character
];
for (var _i = 0; _i < objects.length; _i++) {
    var box = objects[_i];
    box.listenTo(box, "change-different", change);
}
function change() {
    ticksSinceChange = 0;
}
function objsWithoutCharacter() {
    return objects.filter(function (val) { return val != character; });
}
function allVertices() {
    var allObjs = objsWithoutCharacter();
    var result = [];
    for (var _i = 0; _i < allObjs.length; _i++) {
        var obj = allObjs[_i];
        result = result.concat(obj.vertices());
    }
    return result;
}
function start() {
    canvas = document.getElementById("main");
    context = canvas.getContext('2d');
    context.translate(0.5, 0.5);
    setUpListeners();
    requestAnimationFrame(renderScene);
}
function renderScene() {
    context.clearRect(-1, -1, CANV_W + 1, CANV_H + 1);
    drawGrid();
    drawRays();
    drawObjects();
    requestAnimationFrame(renderScene);
    ++ticksSinceChange;
}
function drawRays() {
    var lineOrigin = character.center();
    var lineEndpoints = [];
    var verts = allVertices();
    for (var _i = 0; _i < objects.length; _i++) {
        var box = objects[_i];
        if (box == character)
            continue;
        var vertexList = box.vertices();
        for (var _a = 0; _a < vertexList.length; _a++) {
            var vertex = vertexList[_a];
            if (lineOrigin.eq(vertex))
                continue;
            var lineEnd = raycast(lineOrigin, vertex, objsWithoutCharacter(), true);
            if (lineOrigin.dist2(lineEnd) == lineOrigin.dist2(vertex)) {
                lineEndpoints.push(vertex);
            }
            if (lineOrigin.dist2(lineEnd) > lineOrigin.dist2(vertex)) {
                lineEndpoints.push(lineEnd);
            }
        }
    }
    for (var _b = 0; _b < lineEndpoints.length; _b++) {
        var endpoint = lineEndpoints[_b];
        var verticesOnLine = verts.filter(function (vert) { return vert.isOnSegment(lineOrigin, endpoint); });
        drawLine(context, lineOrigin, endpoint, "red");
        for (var _c = 0; _c < verticesOnLine.length; _c++) {
            var vertex = verticesOnLine[_c];
            if (verticesOnLine.length > 1) {
                vertex.draw("red", 10 - Math.min(ticksSinceChange * ticksSinceChange / 10, 5));
            }
            else {
                vertex.draw();
            }
        }
    }
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
            if (selectedThing.isPlayer) {
                selectedThing.x = Math.round(ev.offsetX / CELL_W) * CELL_W;
                selectedThing.y = Math.round(ev.offsetY / CELL_H) * CELL_H;
            }
            else {
                selectedThing.x = Math.floor(ev.offsetX / CELL_W) * CELL_W;
                selectedThing.y = Math.floor(ev.offsetY / CELL_H) * CELL_H;
            }
        }
    });
    canvas.addEventListener("mouseup", function (ev) {
        selectedThing = null;
    });
}
function drawGrid() {
    for (var x = CELL_W; x < CANV_W; x += CELL_W) {
        drawLine(context, new Vertex(x, 0), new Vertex(x, CANV_H), "lightgray");
    }
    for (var y = CELL_W; y < CANV_H; y += CELL_H) {
        drawLine(context, new Vertex(0, y), new Vertex(CANV_W, y), "lightgray");
    }
}
function drawObjects() {
    for (var _i = 0; _i < objects.length; _i++) {
        var object = objects[_i];
        object.draw(context);
    }
}
document.addEventListener("DOMContentLoaded", function (event) {
    start();
});
//# sourceMappingURL=vertex-los.js.map