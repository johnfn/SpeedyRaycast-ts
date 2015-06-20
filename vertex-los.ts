// TODO
// * Highlight doubled-up vertexes with different color.
// * Vertex popping animations?
// * Don't drag character onto box?

var canvas: HTMLCanvasElement;
var context: CanvasRenderingContext2D;

var character: Box = new Box(50, 50, 25, 25, true);
var objects: Box[] = [
  new Box(250, 250, 50, 50),
  new Box(100, 100, 50, 50),
  new Box(100, 250, 50, 50),
  character
];

function objsWithoutCharacter() {
  return objects.filter(val => val != character);
}

function allVertices(): Vertex[] {
  var allObjs = objsWithoutCharacter();
  var result: Vertex[] = [];

  for (var obj of allObjs) {
    result = result.concat(obj.vertices());
  }

  return result;
}

function start() {
  canvas = <HTMLCanvasElement> document.getElementById("main");
  context = <CanvasRenderingContext2D> canvas.getContext('2d');

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
}

function drawRays() {
  var lineOrigin = character.center();
  var lineEndpoints: Vertex[] = [];
  var verts: Vertex[] = allVertices();

  for (var box of objects) {
    if (box == character) continue;

    var vertexList: Vertex[] = box.vertices();

    for (var vertex of vertexList) {
      if (lineOrigin.eq(vertex)) continue;

      var lineEnd = raycast(lineOrigin, vertex, objsWithoutCharacter(), true);

      if (lineOrigin.dist2(lineEnd) == lineOrigin.dist2(vertex)) {
        lineEndpoints.push(vertex);
      }

      if (lineOrigin.dist2(lineEnd) > lineOrigin.dist2(vertex)) {
        lineEndpoints.push(lineEnd);
      }
    }
  }

  for (var endpoint of lineEndpoints) {
    drawLine(context, lineOrigin, endpoint, "red");

    var verticesOnLine = verts.filter(vert => vert.isOnSegment(lineOrigin, endpoint));

    for (var vertex of verticesOnLine) {
      if (verticesOnLine.length > 1) {
        vertex.draw("red");
      } else {
        vertex.draw();
      }
    }
  }
}

function setUpListeners() {
  var selectedThing: Box = null;

  canvas.addEventListener("mousedown", (ev: MouseEvent) => {
    var point = new Vertex(ev.offsetX, ev.offsetY);

    for (var obj of objects) {
      if (obj.contains(point, true)) {
        selectedThing = obj;
      }
    }
  });

  canvas.addEventListener("mousemove", (ev: MouseEvent) => {
    if (selectedThing != null && !outOfBounds(new Vertex(ev.offsetX, ev.offsetY))) {
      if (selectedThing.isPlayer) {
        selectedThing.x = Math.round(ev.offsetX / CELL_W) * CELL_W ;
        selectedThing.y = Math.round(ev.offsetY / CELL_H) * CELL_H ;
      } else {
        selectedThing.x = Math.floor(ev.offsetX / CELL_W) * CELL_W ;
        selectedThing.y = Math.floor(ev.offsetY / CELL_H) * CELL_H ;
      }
    }
  });

  canvas.addEventListener("mouseup", (ev: MouseEvent) => {
    selectedThing = null;
  });
}

function drawGrid():void {
  for (var x = CELL_W; x < CANV_W; x += CELL_W) {
    drawLine(context, new Vertex(x, 0), new Vertex(x, CANV_H), "lightgray");
  }

  for (var y = CELL_W; y < CANV_H; y += CELL_H) {
    drawLine(context, new Vertex(0, y), new Vertex(CANV_W, y), "lightgray");
  }
}

function drawObjects():void {
  for (var object of objects) {
    object.draw(context);
  }
}

document.addEventListener("DOMContentLoaded", (event) => {
  start();
});