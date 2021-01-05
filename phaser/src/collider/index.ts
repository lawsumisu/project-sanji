import * as Phaser from 'phaser';
import { Capsule, Scalar, Vector2 } from '@lawsumisu/common-utilities';
import { CapsuleBoxConfig, CircleBoxConfig } from 'src/characters/frameData';

type BoxType<T = ColliderType> = T extends ColliderType.CIRCLE
  ? Phaser.Geom.Circle
  : T extends ColliderType.CAPSULE
  ? Capsule
  : Phaser.Geom.Rectangle;

export enum ColliderType {
  CIRCLE = 'CIRCLE',
  RECT = 'RECT',
  CAPSULE = 'CAPSULE'
}

export enum HitType {
  HIGH = 'HIGH',
  MID = 'MID',
  LOW = 'LOW',
  HEAVY = 'HEAVY',
  LIGHT = 'LIGHT',
  MEDIUM = 'MEDIUM',
  LAUNCH = 'LAUNCH'
}
export interface Hit {
  damage: number;
  angle: number;
  knockback: number;
  type: string[];
}

export interface Direction {
  x: boolean; // true === RIGHT; false === LEFT
  y: boolean; // true === UP; false === DOWN
}

export abstract class Collider<T extends ColliderType = ColliderType> {
  public static checkCollision(
    c1: Collider,
    c2: Collider,
    params: Partial<{
      c1: { offset: Vector2; orientation: Direction };
      c2: { offset: Vector2; orientation: Direction };
    }> = {}
  ): boolean {
    const {
      c1: c1Params = { offset: Vector2.ZERO, orientation: { x: true, y: true } },
      c2: c2Params = { offset: Vector2.ZERO, orientation: { x: true, y: true } }
    } = params;
    if (c1.isCircular()) {
      if (c2.isCircular()) {
        return Phaser.Geom.Intersects.CircleToCircle(
          c1.transformBox(c1Params.offset, c1Params.orientation),
          c2.transformBox(c2Params.offset, c2Params.orientation)
        );
      } else if (c2.isCapsular()) {
        const circle = c1.transformBox(c1Params.offset, c1Params.orientation);
        return c2.transformBox(c2Params.offset, c2Params.orientation).intersects({
          x: circle.x,
          y: circle.y,
          r: circle.radius
        });
      } else {
        return false;
      }
    } else if (c1.isCapsular()) {
      if (c2.isCapsular()) {
        return c1
          .transformBox(c1Params.offset, c1Params.orientation)
          .intersects(c2.transformBox(c2Params.offset, c2Params.orientation));
      } else if (c2.isCircular()) {
        return Collider.checkCollision(c2, c1, { c1: c2Params, c2: c1Params });
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public readonly box: BoxType<T>;
  protected readonly type: T;

  protected constructor(type: T, box: BoxType<T>) {
    this.type = type;
    this.box = box;
  }

  public isCircular(): this is Collider<ColliderType.CIRCLE> {
    return this.type === ColliderType.CIRCLE;
  }

  public isRectangular(): this is Collider<ColliderType.RECT> {
    return this.type === ColliderType.RECT;
  }

  public isCapsular(): this is Collider<ColliderType.CAPSULE> {
    return this.type === ColliderType.CAPSULE;
  }

  public transformBox(o: Vector2, orientation: Direction = { x: true, y: true }): BoxType<T> {
    const d = !orientation.x ? -1 : 1;
    if (this.isCircular()) {
      const { x, y, radius: r } = this.box;
      return new Phaser.Geom.Circle(x * d + o.x, y + o.y, r) as BoxType<T>;
    } else if (this.isCapsular()) {
      const { x1, y1, x2, y2, r } = this.box;
      return new Capsule(r, { x1: x1 * d + o.x, x2: x2 * d + o.x, y1: y1 + o.y, y2: y2 + o.y }) as BoxType<T>;
    } else {
      return this.box;
    }
  }
}

export class Hurtbox<T extends ColliderType = ColliderType> extends Collider<T> {
  public static generateCircular(box: CircleBoxConfig): Hurtbox<ColliderType.CIRCLE> {
    return new Hurtbox(ColliderType.CIRCLE, new Phaser.Geom.Circle(box.x, box.y, box.r));
  }

  public static generateCapsular(box: CapsuleBoxConfig): Hurtbox<ColliderType.CAPSULE> {
    return new Hurtbox(ColliderType.CAPSULE, new Capsule(box.r, { x1: box.x1, x2: box.x2, y1: box.y1, y2: box.y2 }));
  }
}

export class Hitbox<T extends ColliderType = ColliderType> extends Collider<T> {
  public static generateCircular(box: CircleBoxConfig, hit: Hit): Hitbox<ColliderType.CIRCLE> {
    return new Hitbox(ColliderType.CIRCLE, new Phaser.Geom.Circle(box.x, box.y, box.r), hit);
  }

  public static generateCapsular(box: CapsuleBoxConfig, hit: Hit): Hitbox<ColliderType.CAPSULE> {
    return new Hitbox(
      ColliderType.CAPSULE,
      new Capsule(box.r, { x1: box.x1, x2: box.x2, y1: box.y1, y2: box.y2 }),
      hit
    );
  }

  public static generateRectangular(box: Phaser.Geom.Rectangle, hit: Hit): Hitbox<ColliderType.RECT> {
    return new Hitbox(ColliderType.RECT, box, hit);
  }

  public static transformHit(hit: Hit, orientation: Direction): Hit {
    const angleInDegrees = !orientation.x ? 180 - hit.angle : hit.angle;
    return { ...hit, angle: Scalar.toRadians(angleInDegrees) };
  }

  public readonly hit: Hit;

  constructor(type: T, box: BoxType<T>, hit: Hit) {
    super(type, box);
    this.hit = hit;
  }
}

interface CollisionDataOptions {
  persist: boolean | (() => boolean);
}

export abstract class CollisionData<C extends Collider<ColliderType>> {
  public readonly data: C[];
  public readonly tag: string;
  public readonly index: number;
  public readonly persist: boolean | (() => boolean);
  public readonly owner: string;

  constructor(data: C[], tag: string, owner: string, index: number, options: Partial<CollisionDataOptions> = {}) {
    this.data = data;
    this.tag = tag;
    const { persist = false } = options;
    this.index = index;
    this.persist = persist;
    this.owner = owner;
  }

  public get isEmpty(): boolean {
    return this.tag === 'empty';
  }
}

export class HurtboxData extends CollisionData<Hurtbox> {
  static get EMPTY(): HurtboxData {
    return new HurtboxData([], 'empty', 'empty', 0);
  }
}

export class HitboxData extends CollisionData<Hitbox> {
  static get EMPTY(): HitboxData {
    return new HitboxData([], 'empty', 'empty', 0);
  }

  protected readonly _registeredCollisions: Set<string> = new Set();
  protected readonly ignoreCollisionTags: Set<string>;

  constructor(
    data: Hitbox[],
    tag: string,
    owner: string,
    index: number,
    options: Partial<
      CollisionDataOptions & { registeredCollisions: Set<string>; ignoreCollisionTags: Set<string> }
    > = {}
  ) {
    super(data, tag, owner, index, options);
    this._registeredCollisions = new Set(options.registeredCollisions);
    this.ignoreCollisionTags = new Set(options.ignoreCollisionTags);
  }

  public registerCollision(collisionData: CollisionData<Collider>): void {
    const tag = [this.tag, collisionData.owner].join('-');
    this._registeredCollisions.add(tag);
  }

  public hasCollided(collisionData: CollisionData<Collider>): boolean {
    const tag = [this.tag, collisionData.owner].join('-');
    return this._registeredCollisions.has(tag);
  }

  public canIgnoreCollision(tag: string): boolean {
    return this.ignoreCollisionTags.has(tag);
  }

  public get registeredCollisions(): Set<string> {
    return new Set(this._registeredCollisions);
  }
}

export interface CollisionDataMap {
  hitData: HitboxData;
  hurtData: HurtboxData;
}
