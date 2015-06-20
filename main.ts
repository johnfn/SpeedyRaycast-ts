/// <reference path="defs.d.ts" />

(() => {
  var canvas: HTMLCanvasElement;
  var context: CanvasRenderingContext2D;

  var character: Box = new Box(300, 300, 30, 30, true);

  var mapBoundary: Vertex[] = [
    new Vertex(0, 0),
    new Vertex(500, 0),
    new Vertex(500, 500),
    new Vertex(0, 500)
  ];

  var objects: Box[] = [new Box(150, 150, 80, 80), character];

  function objectEdges(): Vertex[][] {
    return objects
      .map((box: Box) => box.vertices())
      .filter((val: Vertex[]) => val.length != 0);
  }

  function start() {
    canvas = <HTMLCanvasElement> document.getElementById("main");
    context = <CanvasRenderingContext2D> canvas.getContext('2d');

    setUpListeners();

    requestAnimationFrame(renderScene);
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
        selectedThing.x = ev.offsetX;
        selectedThing.y = ev.offsetY;
      }
    });

    canvas.addEventListener("mouseup", (ev: MouseEvent) => {
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
    for (var list of objectEdges()) {
      context.fillStyle = '#000';
      context.beginPath();

      context.moveTo(list[0].x, list[0].y);

      for (var vertex of list) {
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
    var allVertices: Vertex[] = [];
    var origin: Vertex = character.center();

    for (var path of objectEdges()) {
      for (var vertex of path) {
        allVertices.push(vertex);
      }
    }

    for (var vertex of mapBoundary) {
      allVertices.push(vertex);
    }
    for (var vertex of allVertices) {
      var raycastEnd = raycast(origin, vertex, objects, true);

      if (origin.dist2(raycastEnd) < origin.dist2(vertex)) {
        continue;
      }

      if (raycastEnd.eq(vertex)) {
        drawLine(context, origin, raycastEnd, "gray");
      } else {
        drawLine(context, origin, vertex, "gray");
        drawLine(context, vertex, raycastEnd, "gray", true);
      }
    }
  }

  document.addEventListener("DOMContentLoaded", (event) => {
    start();
  });
})();