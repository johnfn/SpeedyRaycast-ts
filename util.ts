/// <reference path="defs.d.ts" />

var CANV_W = 500;
var CANV_H = 500;

var CELL_W = 50;
var CELL_H = 50;

class Vertex {
  constructor(public x: number, public y: number) {}

  eq(other: Vertex) {
    return almost(this.x, other.x) && almost(this.y, other.y);
  }

  clone():Vertex {
    return new Vertex(this.x, this.y);
  }

  // distance^2 to other
  dist2(other: Vertex): number {
    return (this.x - other.x) * (this.x - other.x) +
      (this.y - other.y) * (this.y - other.y);
  }

  draw(color: string = "blue", size: number = 5): void {
    context.beginPath();
    context.arc(this.x, this.y, size, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
  }

  isOnSegment(start: Vertex, end: Vertex): boolean {
    return this.isOnLine(start, end) &&
      isWithinRange(this.x, start.x, end.x) && // The point is within the segment.
      isWithinRange(this.y, start.y, end.y);
  }

  isOnLine(start: Vertex, end: Vertex): boolean {
    // Special case for vertical lines (which have an undefined slope).
    if (Math.abs(end.x - start.x) < .001) {
      return almost(this.x, start.x);
    }

    var m = (end.y - start.y) / (end.x - start.x);
    var b = start.y - m * start.x;

    return almost(this.y, m * this.x + b);
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

    //TODO - there's a better way
    if (this.isPlayer) return [];

    return [
      new Vertex(x, y),
      new Vertex(x + width, y),
      new Vertex(x + width, y + height),
      new Vertex(x, y + height)
    ];
  }

  center(): Vertex {
    return new Vertex(this.x, this.y);
  }

  contains(v: Vertex, checkForPlayerToo: boolean = false) {
    if (this.isPlayer && !checkForPlayerToo) return false;

    if (this.isPlayer) {
      return Math.sqrt(v.dist2(this.center())) < this.width;
    } else {
      return v.x > this.x && v.x < this.x + this.width &&
             v.y > this.y && v.y < this.y + this.height;
    }
  }

  draw(context: CanvasRenderingContext2D): void {
    if (this.isPlayer) {
      this.drawCircle(context);

      return;
    }

    var list: Vertex[] = this.vertices();

    context.fillStyle = '#888';
    context.beginPath();
    context.moveTo(list[0].x, list[0].y);

    for (var vertex of list) {
      context.lineTo(vertex.x, vertex.y);
    }

    context.closePath();
    context.fill();
  }

  drawCircle(context: CanvasRenderingContext2D): void {
    context.beginPath();
    context.arc(this.x, this.y, this.width / 2, 0, 2 * Math.PI, false);
    context.fillStyle = 'lightgray';
    context.fill();
  }
}

function outOfBounds(v: Vertex): boolean {
  return v.x < 0 || v.x > 500 || v.y < 0 || v.y > 500;
}

// Does x almost equal y?
function almost(x: number, y: number) {
  return Math.abs(x - y) < .0001;
}

function isWithinRange(value: number, start: number, end: number) {
  var low = Math.min(start, end);
  var high = Math.max(start, end);

  return value >= low && value <= high;
}

// Raycast from start in the direction of secondPoint. If keepGoing, then continue past
// that point, if possible. Stop if we collide with anything in colliders.
function raycast(start: Vertex, secondPoint: Vertex, colliders: Box[], keepGoing: boolean = false): Vertex {
  if (start.eq(secondPoint)) { return undefined; }

  var direction = new Vertex(secondPoint.x - start.x, secondPoint.y - start.y);
  var magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
  var normalizedDirection = new Vertex(direction.x / magnitude, direction.y / magnitude );
  var currentPosition = start.clone();

  while (keepGoing || (!keepGoing && start.dist2(secondPoint) > start.dist2(currentPosition))) {
    currentPosition = new Vertex(currentPosition.x + normalizedDirection.x, currentPosition.y + normalizedDirection.y);

    if (outOfBounds(currentPosition)) {
      return currentPosition;
    }

    for (var box of colliders) {
      if (box.contains(currentPosition)) {
        return currentPosition;
      }
    }
  }

  return secondPoint;
}

function drawLine(context: CanvasRenderingContext2D, start: Vertex, end: Vertex, color: string = "$000", dashed: boolean = false) {
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.beginPath();

  if (dashed) {
    // Dashed lines don't work in IE<11?? All my hopes are dashed! (TODO)
    context.setLineDash([2, 3]);
  } else {
    context.setLineDash([]);
  }
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
}
