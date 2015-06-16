class Vertex {
  constructor(public x: number, public y: number) {}

  eq(other: Vertex) {
    return almost(this.x, other.x) && almost(this.y, other.y);
  }

  clone():Vertex {
    return new Vertex(this.x, this.y);
  }

  // distance^2 to other
  dist2(other: Vertex):number {
    return (this.x - other.x) * (this.x - other.x) +
      (this.y - other.y) * (this.y - other.y);
  }
}

class Box {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public isPlayer: boolean = false
    ) {}

  vertices() {
    // don't judge me

    var x = this.x;
    var y = this.y;
    var width = this.width;
    var height = this.height;

    if (this.isPlayer) return [];

    return [
      new Vertex(x, y),
      new Vertex(x + width, y),
      new Vertex(x + width, y + height),
      new Vertex(x, y + height)
    ];
  }

  center(): Vertex {
    return new Vertex(this.x + this.width / 2, this.y + this.height / 2);
  }

  contains(v: Vertex, checkForPlayerToo: boolean = false) {
    if (this.isPlayer && !checkForPlayerToo) return false;

    return v.x >= this.x && v.x <= this.x + this.width &&
           v.y >= this.y && v.y <= this.y + this.height;
  }
}

var canvas: HTMLCanvasElement;
var context: CanvasRenderingContext2D;

var character: Box = new Box(200, 200, 30, 30, true);

var mapBoundary: Vertex[] = [
  new Vertex(0, 0),
  new Vertex(500, 0),
  new Vertex(500, 500),
  new Vertex(0, 500)
];

var objects: Box[] = [new Box(10, 10, 80, 80), character];
var objectEdges: Vertex[][] = objects
      .map((box: Box) => box.vertices())
      .filter((val: Vertex[]) => val.length != 0);

function almost(x: number, y: number) {
  return Math.abs(x - y) < .0001;
}

function drawLine(start: Vertex, end: Vertex, color: string = "$000") {
  context.strokeStyle = color;
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
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
  for (var list of objectEdges) {
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

function outOfBounds(v: Vertex): boolean {
  return v.x < 0 || v.x > 500 || v.y < 0 || v.y > 500;
}

// Raycast from start in the direction of secondPoint. If keepGoing, then potentially continue to
// raycast past that point.
function raycast(start: Vertex, secondPoint: Vertex, keepGoing: boolean = false): Vertex {
  var direction = new Vertex(secondPoint.x - start.x, secondPoint.y - start.y);
  var magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
  var normalizedDirection = new Vertex(direction.x / magnitude, direction.y / magnitude );
  var currentPosition = start.clone();

  while (keepGoing || (!keepGoing && start.dist2(secondPoint) > start.dist2(currentPosition))) {
    currentPosition = new Vertex(currentPosition.x + normalizedDirection.x, currentPosition.y + normalizedDirection.y);

    if (outOfBounds(currentPosition)) {
      return currentPosition;
    }

    for (var box of objects) {
      if (box.contains(currentPosition)) {
        return currentPosition;
      }
    }
  }

  return secondPoint;
}

function drawLOSRays() {
  var allVertices: Vertex[] = [];
  var origin: Vertex = character.center();

  for (var path of objectEdges) {
    for (var vertex of path) {
      allVertices.push(vertex);
    }
  }

  for (var vertex of mapBoundary) {
    allVertices.push(vertex);
  }

  for (var vertex of allVertices) {
    var end = raycast(origin, vertex, true);

    drawLine(origin, end, "gray");
  }
}

document.addEventListener("DOMContentLoaded", (event) => {
  start();
});
