import * as Phaser from 'phaser';
import { Vector2 } from '@lawsumisu/common-utilities';


export enum ColliderType {
    CIRCLE = 'CIRCLE',
    RECT = 'RECT'
}

export interface Hit {
    damage: number;
    angle: number;
    baseKnockback: number;
    knockbackScaling: number;
    fixedKnockback?: boolean;
    maxLaunchSpeed?: Vector2;
    hitlagMultiplier?: number;
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

interface FrameDataOptions {
    persist: boolean | (() => boolean);
}

export abstract class FrameData<C extends Collider<ColliderType>> {
    public readonly data: C[];
    public readonly tag: string;
    public readonly index: number;
    public readonly persist: boolean | (() => boolean);
    public readonly owner: string;

    constructor(data: C[], tag: string, owner: string, index: number, options: Partial<FrameDataOptions> = {}) {
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

export class HurtboxData extends FrameData<Hurtbox> {
    static get EMPTY(): HurtboxData {
        return new HurtboxData([], 'empty', 'empty', 0);
    }
}

export class HitboxData extends FrameData<Hitbox> {
    static get EMPTY(): HitboxData {
        return new HitboxData([], 'empty', 'empty', 0);
    }

    protected readonly _hits: Set<string> = new Set();

    constructor(
        data: Hitbox[],
        tag: string,
        owner: string,
        index: number,
        options: Partial<FrameDataOptions & { hits: Set<string> }> = {}
    ) {
        super(data, tag, owner, index, options);
        const { hits = new Set() } = options;
        hits.forEach((hit: string) => this._hits.add(hit));
    }

    public addHit(frameData: FrameData<Collider>): void {
        this._hits.add(frameData.owner);
    }

    public hasHit(frameData: FrameData<Collider>): boolean {
        return this._hits.has(frameData.owner);
    }

    public get hits(): Set<string> {
        const H = new Set<string>();
        this._hits.forEach((hit: string) => H.add(hit));
        return H;
    }
}

export interface FrameDataMap {
    hitData: HitboxData;
    hurtData: HurtboxData;
}
