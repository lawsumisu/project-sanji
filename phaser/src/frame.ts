import * as Phaser from 'phaser';


export enum ColliderType {
    CIRCLE = 'CIRCLE',
    RECT = 'RECT'
}

export interface Hit {
    damage: number;
    angle: number;
    knockback: number;
}

export interface Direction {
    x: boolean; // true === RIGHT; false === LEFT
    y: boolean; // true === UP; false === DOWN
}

export abstract class Collider<T extends ColliderType = ColliderType> {
    public readonly box: T extends ColliderType.CIRCLE ? Phaser.Geom.Circle : Phaser.Geom.Rectangle;
    protected readonly type: T;

    protected constructor(type: T, box: T extends ColliderType.CIRCLE ? Phaser.Geom.Circle : Phaser.Geom.Rectangle) {
        this.type = type;
        this.box = box;
    }

    public isCircular(): this is Collider<ColliderType.CIRCLE> {
        return this.type === ColliderType.CIRCLE;
    }

    public isRectangular(): this is Collider<ColliderType.RECT> {
        return this.type === ColliderType.RECT;
    }
}

export class Hurtbox<T extends ColliderType = ColliderType> extends Collider<T> {
    public static generateCircular(box: Phaser.Geom.Circle): Hurtbox<ColliderType.CIRCLE> {
        return new Hurtbox(ColliderType.CIRCLE, new Phaser.Geom.Circle(box.x, box.y, box.radius));
    }
}

export class Hitbox<T extends ColliderType = ColliderType> extends Collider<T> {
    public static generateCircular(
        box: Phaser.Geom.Circle,
        hit: Hit,
        direction: Direction = { x: true, y: true }
    ): Hitbox<ColliderType.CIRCLE> {
        const d = !direction.x ? -1 : 1;
        const H = { ...hit, angle: !direction.x ? 180 - hit.angle : hit.angle };
        return new Hitbox(ColliderType.CIRCLE, new Phaser.Geom.Circle(box.x * d, box.y, box.radius), H);
    }

    public static generateRectangular(box: Phaser.Geom.Rectangle, hit: Hit): Hitbox<ColliderType.RECT> {
        return new Hitbox(ColliderType.RECT, box, hit);
    }

    public readonly hit: Hit;

    constructor(type: T, box: T extends ColliderType.CIRCLE ? Phaser.Geom.Circle : Phaser.Geom.Rectangle, hit: Hit) {
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

    constructor(
        data: Hitbox[],
        tag: string,
        owner: string,
        index: number,
        options: Partial<CollisionDataOptions & { registeredCollisions: Set<string> }> = {}
    ) {
        super(data, tag, owner, index, options);
        this._registeredCollisions = new Set(options.registeredCollisions);
    }

    public registerCollision(collisionData: CollisionData<Collider>): void {
        this._registeredCollisions.add(collisionData.owner);
    }

    public hasCollided(collisionData: CollisionData<Collider>): boolean {
        return this._registeredCollisions.has(collisionData.owner);
    }

    public get registeredCollisions(): Set<string> {
        return new Set(this._registeredCollisions);
    }
}

export interface CollisionDataMap {
    hitData: HitboxData;
    hurtData: HurtboxData;
}
