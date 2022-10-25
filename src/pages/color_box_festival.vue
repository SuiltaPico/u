<script setup lang="ts">
import p5 from "p5";
import {
  b2World,
  b2PolygonShape,
  b2CircleShape,
  b2ChainShape,
  b2Color,
  b2BodyType,
} from "@box2d/core";
import {
  b2Draw,
  b2Transform,
  XY,
  RGBA,
  b2Body,
  b2BodyDef,
  b2Fixture,
  b2FixtureDef,
  b2Shape,
} from "@box2d/core";
import { onMounted, ref } from "vue";

const contaniner = ref<HTMLDivElement>();

class Camera {
  x = 0;
  y = 0;
  constructor() {}
}

class Sprite {
  x = 0;
  y = 0;
  constructor() {}
}

class B2Drawer implements b2Draw {
  p: p5;
  constructor(p: p5) {
    this.p = p;
  }
  PushTransform(xf: b2Transform): void {
    this.p.push();
    this.DrawTransform(xf);
  }
  PopTransform(xf: b2Transform): void {
    this.p.pop();
  }
  DrawPolygon(vertices: XY[], vertexCount: number, color: RGBA): void {
    this.p.beginShape();
    this.p.fill(color.r, color.g, color.b, color.a);
    for (let i = 0; i < vertexCount; i++) {
      const v = vertices[i];
      this.p.vertex(v.x, v.y);
    }
    this.p.endShape("close");
  }
  DrawSolidPolygon(vertices: XY[], vertexCount: number, color: RGBA): void {
    this.p.beginShape();
    this.p.fill(color.r, color.g, color.b, color.a);
    for (let i = 0; i < vertexCount; i++) {
      const v = vertices[i];
      this.p.vertex(v.x, v.y);
    }
    this.p.endShape("close");
  }
  DrawCircle(center: XY, radius: number, color: RGBA): void {
    this.p.fill(color.r, color.g, color.b, color.a);
    this.p.circle(center.x, center.y, radius * 2);
  }
  DrawSolidCircle(center: XY, radius: number, axis: XY, color: RGBA): void {
    this.p.fill(color.r, color.g, color.b, color.a);
    this.p.circle(center.x, center.y, radius * 2);
  }
  DrawSegment(p1: XY, p2: XY, color: RGBA): void {
    this.p.stroke(color.r, color.g, color.b, color.a);
    this.p.line(p1.x, p1.y, p2.x, p2.y);
  }
  DrawTransform(xf: b2Transform): void {
    const pos = xf.GetPosition();
    this.p.translate(pos.x, pos.y);
    this.p.rotate(xf.GetAngle());
  }
  DrawPoint(p: XY, size: number, color: RGBA): void {
    this.p.fill(color.r, color.g, color.b, color.a);
    this.p.stroke(color.r, color.g, color.b, color.a);
    this.p.circle(p.x, p.y, size);
  }
}

function* b2iter<T extends { GetNext(): T | null } | null>(b2list: T) {
  let list: T | null = b2list;
  while (list !== null) {
    yield list;
    list = list.GetNext();
  }
}

class B2Object<S extends undefined> {
  body: b2Body;
  fixture: b2Fixture[] = [];
  constructor(
    world: b2World,
    body_def: b2BodyDef,
    fixture_def: Partial<b2FixtureDef> | Partial<b2FixtureDef>[],
    shape?: b2Shape | b2Shape[]
  ) {
    this.body = world.CreateBody(body_def);
    if (!Array.isArray(fixture_def)) {
      this.fixture.push(
        this.body.CreateFixture(
          (() => {
            if (shape) {
              return {
                ...fixture_def,
                shape: Array.isArray(shape) ? shape[0] : shape,
              };
            } else if (!fixture_def.shape) {
              throw new Error(
                "如果参数没有指明 shape，应当在 fixture_def 指明。"
              );
            } else {
              return fixture_def as b2FixtureDef;
            }
          })()
        )
      );
    } else {
      for (let i = 0; i < fixture_def.length; i++) {
        const def = fixture_def[i];
        this.fixture.push(
          this.body.CreateFixture(
            (() => {
              if (shape) {
                return {
                  ...def,
                  shape: Array.isArray(shape) ? shape[i] : shape,
                };
              } else if (!def.shape) {
                throw new Error(
                  "如果参数没有指明 shape，应当在 fixture_def 指明。"
                );
              } else {
                return def as b2FixtureDef;
              }
            })()
          )
        );
      }
    }
  }
}

const create_canvas = () =>
  new p5((_p) => {
    const p = _p as p5;

    const camera = new Camera();

    const world = b2World.Create({
      x: 0,
      y: 1,
    });

    world.SetAllowSleeping(false);

    const obj = new B2Object(
      world,
      {
        position: {
          x: 500,
          y: 20,
        },
        type: b2BodyType.b2_dynamicBody,
        gravityScale: 2,
      },
      {
        density: 1,
        friction: 0.05,
      },
      new b2PolygonShape().SetAsBox(10, 10)
    );

    const obj2 = new B2Object(
      world,
      {
        position: {
          x: 500,
          y: 500,
        },
        type: b2BodyType.b2_staticBody,
        angle: 0.05,
      },
      {
        density: 0.8,
        friction: 0.1,
        restitution: 0.5,
      },
      new b2PolygonShape().SetAsBox(500, 10)
    );

    p.mouseClicked = (event) => {
      for (let i = 0; i < 10; i++) {
        new B2Object(
          world,
          {
            position: {
              x: p.mouseX + p.random(0, 20),
              y: p.mouseY + p.random(0, 20),
            },
            type: b2BodyType.b2_dynamicBody,
          },
          {
            density: 0.1,
            friction: p.random(0, 20),
            restitution: 0.2,
          },
          new b2PolygonShape().Set([
            { x: 0, y: 0 },
            { x: 30, y: 0 },
            { x: 0, y: 30 },
          ])
        );
      }
    };

    const drawer = new B2Drawer(p);

    function update_physical_world(delta_time: number) {
      world.Step(delta_time / 60, {
        positionIterations: 6,
        velocityIterations: 6,
      });
    }

    function render_body() {
      for (const body of b2iter(world.GetBodyList())) {
        const pos = body.GetPosition();
        const angle = body.GetAngle();
        const trans = new b2Transform()
          .SetPosition(pos)
          .SetRotationAngle(angle);

        drawer.PushTransform(trans);
        for (const fixture of b2iter(body.GetFixtureList())) {
          const shape = fixture.GetShape();
          const friction = fixture.GetFriction();
          const density = fixture.GetDensity();
          shape.Draw(drawer, new b2Color(0, density, friction / 20));
        }
        drawer.PopTransform(trans);
      }
    }

    p.setup = () => {
      p.createCanvas(innerWidth, innerHeight);
      p.colorMode(p.RGB, 1, 1, 1, 1);
      p.frameRate(120);
    };

    p.draw = () => {
      if (p.frameCount % 20 === 0) {
        obj.body.ApplyForceToCenter({ x: (p.mouseX - obj.body.GetPosition().x) ** 3 * 100, y:  (p.mouseY - obj.body.GetPosition().y) ** 3 * 100 });
        obj.body.ApplyTorque(p.randomGaussian(100000, 100000))
      }
      update_physical_world(p.deltaTime);

      p.clear(1, 1, 1, 0);
      render_body();
    };
  }, contaniner.value);

onMounted(() => {
  const p = create_canvas();
  addEventListener("resize", () => {
    p.resizeCanvas(innerWidth, innerHeight);
  });
});
</script>

<template lang="pug">
q-page
  div#contaniner(ref="contaniner")
</template>
