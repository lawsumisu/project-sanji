import * as _ from 'lodash';

export interface QuadtreeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface QuadtreeNodes<T> {
  NW: Quadtree<T>;
  NE: Quadtree<T>;
  SW: Quadtree<T>;
  SE: Quadtree<T>;
}

export class Quadtree<T = any> {
  private readonly _bounds: QuadtreeBounds;
  private items: T[] = [];
  private readonly getBoundsFn: (item: T) => QuadtreeBounds;
  private nodes: QuadtreeNodes<T> | null = null;
  private readonly N: number;

  constructor(bounds: QuadtreeBounds, getBoundsFn: (item: T) => QuadtreeBounds, N = 7) {
    this._bounds = bounds;
    this.getBoundsFn = getBoundsFn;
    this.N = N;
  }

  public insert(item: T): void {
    const itemBounds = this.getBoundsFn(item);
    if (!this.contains(itemBounds)) {
      return;
    } else if (this.nodes) {
      const containingNode = _.find(this.nodes, (node: Quadtree<T>) => node.contains(itemBounds));
      if (containingNode) {
        containingNode.insert(item);
      } else {
        this.items.push(item);
      }
    } else if (this.items.length < this.N - 1) {
      this.items.push(item);
    } else {
      const { x, y } = this._bounds;
      const width = this._bounds.width / 2;
      const height = this._bounds.height / 2;
      this.nodes = {
        NW: new Quadtree<T>({ x, y, width, height }, this.getBoundsFn),
        NE: new Quadtree<T>({ x: x + width, y, width, height }, this.getBoundsFn),
        SW: new Quadtree<T>({ x, y: y + height, width, height }, this.getBoundsFn),
        SE: new Quadtree<T>({ x: x + width, y: y + height, width, height }, this.getBoundsFn)
      };
      const items = this.items;
      this.items = [];
      items.forEach((i: T) => this.insert(i));
      this.insert(item);
    }
  }

  public getIntersections<I = T>(query: I, getBoundsFn: (q: I) => QuadtreeBounds, check: (i: T, q: I) => boolean): T[] {
    const queryBounds = getBoundsFn(query);
    const intersections = this.items.filter((item: T) => check(item, query));
    if (this.nodes) {
      return _.chain(this.nodes)
        .filter((node: Quadtree<T>) => node.intersects(queryBounds))
        .reduce((acc: T[], node: Quadtree<T>) => {
          node.getIntersections(query, getBoundsFn, check).forEach((intersection: T) => acc.push(intersection));
          return acc;
        }, intersections)
        .value();
    } else {
      return intersections;
    }
  }

  public forEach(fn: (item: T) => void): void {
    this.items.forEach(fn);
    if (this.nodes) {
      _.forEach(this.nodes, (node: Quadtree<T >) => node.forEach(fn));
    }
  }

  public forEachNode(fn: (node: Quadtree<T>) => void): void {
    fn(this);
    if (this.nodes) {
      _.forEach(this.nodes, (n: Quadtree<T>) => n.forEachNode(fn));
    }
  }

  public get bounds(): QuadtreeBounds {
    return { ...this._bounds };
  }

  private contains(bounds: QuadtreeBounds): boolean {
    const { x, y, width, height } = bounds;
    return (
      x >= this._bounds.x &&
      y >= this._bounds.y &&
      x + width <= this._bounds.x + this._bounds.width &&
      y + height <= this._bounds.y + this._bounds.height
    );
  }

  private intersects(bounds: QuadtreeBounds): boolean {
    const x1 = Math.min(bounds.x, this._bounds.x);
    const x2 = x1 + (x1 === bounds.x ? bounds.width : this._bounds.width);
    const y1 = Math.min(bounds.y, this._bounds.y);
    const y2 = y1 + (y1 === bounds.y ? bounds.height : this._bounds.height);

    const x = x1 === bounds.x ? this._bounds.x : bounds.x;
    const width = x === bounds.x ? bounds.width : this._bounds.width;
    const y = y1 === bounds.y ? this._bounds.y : bounds.y;
    const height = y === bounds.y ? bounds.height : this._bounds.height;

    const xCondition = (x >= x1 && x <= x2) || (x + width >= x1 && x + width <= x2);
    const yCondition = (y >= y1 && y <= y2) || (y + height >= y1 && y + height <= y2);
    return xCondition && yCondition;
  }
}
