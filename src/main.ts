import "./style.css";
import cottageVertexSets from "./cottage.json";
import treesVertexSets from "./trees.json";
import cottageSrc from "/cottage.png";
import treesSrc from "/trees.png";
import "pathseg";
import * as decomp from "poly-decomp";
import type { IBodyDefinition } from "matter-js";
import Matter from "matter-js";

Matter.Common.setDecomp(decomp);

const WIDTH = 400;
const HEIGHT = 800;
const WALL_THICKNESS = 4;
const BOTTOM_MARGIN = 100;
const FLAKE_MIN = 2;
const FLAKE_MAX = 8;

enum Category {
  Passive = 0x0000,
  Terrain = 0x0001,
  Front = 0x0002,
  Middle = 0x0004,
  Back = 0x0008,
}
const Color: Record<Category, [number, number, number]> = {
  [Category.Passive]: [0, 0, 0],
  [Category.Terrain]: [0, 0, 0],
  [Category.Front]: [227, 19, 85],
  [Category.Middle]: [236, 25, 75],
  [Category.Back]: [207, 24, 66],
};
const Scale: Record<Category, number> = {
  [Category.Passive]: 0,
  [Category.Terrain]: 0,
  [Category.Front]: 1,
  [Category.Middle]: 0.6,
  [Category.Back]: 0.3,
};

const canvas = document.createElement("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;
canvas.style.background = "lightblue";
document.body.appendChild(canvas);

const [imgCottage, imgTreesLeft, imgTreesRight] = [
  cottageSrc,
  treesSrc,
  treesSrc,
].map((src) => {
  const img = document.createElement("img");
  img.src = src;
  img.style.position = "absolute";
  img.style.maxWidth = "200px";
  document.body.appendChild(img);
  return img;
});

imgCottage.style.top = "593px";
imgCottage.style.left = "90px";

imgTreesLeft.style.top = "660px";
imgTreesLeft.style.left = "-71px";

imgTreesRight.style.top = "644px";
imgTreesRight.style.left = "261px";

const engine = Matter.Engine.create({
  gravity: {
    y: 0.1, //0.03,
  },
});
const render = Matter.Render.create({
  engine,
  canvas,
  options: {
    wireframes: false,
    background:
      "radial-gradient(circle at 50% 150%, darkorange , midnightblue 70%)",
    width: WIDTH,
    height: HEIGHT,
  },
});

const bodyOptionsTerrain: IBodyDefinition = {
  friction: 0,
  isStatic: true,
  collisionFilter: {
    category: Category.Terrain,
  },
  render: {
    fillStyle: "transparent",
  },
};
const bodyWalls = [
  [WIDTH / 2, WALL_THICKNESS / 2, WIDTH, WALL_THICKNESS],
  [
    WALL_THICKNESS / 2,
    HEIGHT / 2 - BOTTOM_MARGIN / 2,
    WALL_THICKNESS,
    HEIGHT - BOTTOM_MARGIN,
  ],
  [
    WIDTH - WALL_THICKNESS / 2,
    HEIGHT / 2 - BOTTOM_MARGIN / 2,
    WALL_THICKNESS,
    HEIGHT - BOTTOM_MARGIN,
  ],
].map(([x, y, w, h]) =>
  Matter.Bodies.rectangle(x, y, w, h, bodyOptionsTerrain)
);
Matter.Composite.add(engine.world, bodyWalls);

const bodyCottage = Matter.Bodies.fromVertices(
  190,
  660,
  scaleVertexSets(cottageVertexSets, 0.15),
  bodyOptionsTerrain
);

const treeVertexSets = scaleVertexSets(treesVertexSets, 0.15);
const [bodyTreesLeft, bodyTreesRight] = [
  [20, 700],
  [350, 685],
].map(([x, y]) =>
  Matter.Bodies.fromVertices(x, y, treeVertexSets, bodyOptionsTerrain)
);

Matter.Composite.add(engine.world, [
  bodyCottage,
  bodyTreesLeft,
  bodyTreesRight,
]);

const bodyStars = new Array(30).fill(undefined).map(() => {
  const x = Matter.Common.random(0, WIDTH);
  const y = Matter.Common.random(0, HEIGHT / 3);
  const r = Matter.Common.random(1, 3);
  return Matter.Bodies.circle(x, y, r, {
    isStatic: true,
    collisionFilter: {
      category: Category.Passive,
      mask: Category.Passive,
    },
    render: {
      fillStyle: "palegoldenrod",
    },
  });
});
Matter.Composite.add(engine.world, bodyStars);

const snowflakes = [Category.Front, Category.Middle, Category.Back].flatMap(
  (category) => {
    return new Array(200).fill(undefined).map(() => {
      const scale = Scale[category];
      const x = Matter.Common.random(
        WALL_THICKNESS + FLAKE_MAX,
        WIDTH - WALL_THICKNESS - FLAKE_MAX
      );
      const y = Matter.Common.random(WALL_THICKNESS + FLAKE_MAX, HEIGHT / 2);
      const r = Matter.Common.random(FLAKE_MIN, FLAKE_MAX) * scale;
      const [h, s, l] = Color[category];
      return Matter.Bodies.circle(x, y, r, {
        friction: 0,
        frictionAir: (0.01 / scale) * Matter.Common.random(0.5, 1.5),
        collisionFilter: {
          category,
          mask: Category.Terrain | category,
        },
        render: {
          fillStyle: `hsl(${h * Matter.Common.random(0.9, 1.5)},${
            s * Matter.Common.random(0.9, 1.5)
          }%,${l * Matter.Common.random(0.9, 1.5)}%)`,
        },
      });
    });
  }
);
Matter.Composite.add(engine.world, snowflakes);

const mouse = Matter.Mouse.create(render.canvas);
const constraintMouse = Matter.MouseConstraint.create(engine, {
  mouse,
  constraint: {
    stiffness: 0.2,
    render: {
      visible: true,
    },
  },
});
Matter.Composite.add(engine.world, constraintMouse);

Matter.Runner.run(engine);
Matter.Render.run(render);

function scaleVertexSets(
  vertexSets: { x: number; y: number }[][],
  scale: number
) {
  return vertexSets.map((vertices) =>
    Matter.Vertices.scale(vertices, scale, scale, { x: 0, y: 0 })
  );
}

screen.orientation.lock("portrait").catch((e) => {
  console.error(e);
});

window.addEventListener("devicemotion", (e) => {
  if (e.acceleration === null) return;
  const { x, y } = e.acceleration;
  if (x === null || y === null) return;
  const center = Matter.Vector.create(WIDTH / 2, HEIGHT / 2);
  const force = Matter.Vector.create(x, y);
  for (const snowflake of snowflakes)
    Matter.Body.applyForce(snowflake, center, force);
});
