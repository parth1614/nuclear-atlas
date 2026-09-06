import * as T from 'three';
import type { Kind } from './atlas-data';
export type ModelPart = {
  id: string;
  group: T.Group;
  base: T.Vector3;
  offset: T.Vector3;
  anchor: T.Vector3;
};
export type Flow = {
  mesh: T.Mesh;
  curve: T.CatmullRomCurve3;
  phase: number;
  part: string;
  start: number;
  color: number;
};
export type Machine = {
  root: T.Group;
  parts: ModelPart[];
  flows: Flow[];
  rotors: T.Group[];
  plasma?: T.Mesh;
  fields?: T.Group;
};
const steel = 0xb5c5cc,
  dark = 0x405766,
  copper = 0xbe8652,
  orange = 0xe57c39,
  cyan = 0x0da9b7,
  blue = 0x5f9bb8;
function mat(color: number, metalness = 0.55, roughness = 0.28) {
  return new T.MeshStandardMaterial({ color, metalness, roughness });
}
function mesh(
  geo: T.BufferGeometry,
  color: number,
  parent: T.Object3D,
  pos: [number, number, number] = [0, 0, 0],
  metalness = 0.55,
) {
  const m = new T.Mesh(geo, mat(color, metalness));
  m.position.set(...pos);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function cylinder(
  parent: T.Object3D,
  r: number,
  h: number,
  pos: [number, number, number],
  color = steel,
) {
  return mesh(new T.CylinderGeometry(r, r, h, 40), color, parent, pos);
}
function ring(
  parent: T.Object3D,
  r: number,
  tube: number,
  y: number,
  color = steel,
) {
  const m = mesh(new T.TorusGeometry(r, tube, 12, 72), color, parent, [
    0,
    y,
    0,
  ]);
  m.rotation.x = Math.PI / 2;
  return m;
}
function pipe(
  parent: T.Object3D,
  points: number[][],
  color: number,
  radius = 0.1,
) {
  const curve = new T.CatmullRomCurve3(
    points.map((p) => new T.Vector3(...(p as [number, number, number]))),
    false,
    'centripetal',
  );
  const m = mesh(
    new T.TubeGeometry(curve, 64, radius, 10, false),
    color,
    parent,
  );
  return { curve, mesh: m };
}
function cap(
  parent: T.Object3D,
  r: number,
  y: number,
  color = steel,
  flip = false,
) {
  const m = mesh(
    new T.SphereGeometry(r, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    color,
    parent,
    [0, y, 0],
  );
  m.scale.y = 0.36;
  if (flip) m.rotation.z = Math.PI;
  return m;
}
function bolts(parent: T.Object3D, r: number, y: number, count = 20) {
  for (let i = 0; i < count; i++)
    cylinder(
      parent,
      0.043,
      0.1,
      [
        r * Math.cos((i / count) * Math.PI * 2),
        y,
        r * Math.sin((i / count) * Math.PI * 2),
      ],
      dark,
    );
}
function support(parent: T.Object3D, w: number, d: number, y = -2.15) {
  mesh(new T.BoxGeometry(w, 0.18, d), 0xaabcc4, parent, [0, y, 0]);
  for (const x of [-w * 0.38, w * 0.38])
    for (const z of [-d * 0.32, d * 0.32])
      mesh(new T.BoxGeometry(0.15, 0.45, 0.15), dark, parent, [x, y - 0.27, z]);
}
export function createMachine(kind: Kind): Machine {
  const root = new T.Group(),
    parts: ModelPart[] = [],
    flows: Flow[] = [],
    rotors: T.Group[] = [];
  function part(
    id: string,
    base: number[],
    offset: number[],
    anchor = [0, 0, 0],
  ) {
    const g = new T.Group();
    g.position.set(...(base as [number, number, number]));
    root.add(g);
    parts.push({
      id,
      group: g,
      base: g.position.clone(),
      offset: new T.Vector3(...(offset as [number, number, number])),
      anchor: new T.Vector3(...(anchor as [number, number, number])),
    });
    return g;
  }
  function flow(
    parent: T.Group,
    id: string,
    points: number[][],
    color: number,
    start: number,
  ) {
    const { curve } = pipe(parent, points, color, 0.08);
    for (let i = 0; i < 9; i++) {
      const dot = new T.Mesh(
        new T.SphereGeometry(0.075, 8, 8),
        new T.MeshBasicMaterial({
          color: color === blue ? 0x9edfff : 0xffdb86,
        }),
      );
      parent.add(dot);
      flows.push({ mesh: dot, curve, phase: i / 9, part: id, start, color });
    }
  }
  let plasma: T.Mesh | undefined, fields: T.Group | undefined;
  if (kind === 'fission') {
    const vessel = part('vessel', [-3.2, 0, 0], [-2.4, 0.4, 0], [0, 1.4, 0]);
    const shell = mesh(
      new T.CylinderGeometry(
        1.36,
        1.36,
        3.6,
        64,
        1,
        true,
        Math.PI * 0.5,
        Math.PI * 1.4,
      ),
      steel,
      vessel,
    );
    (shell.material as T.MeshStandardMaterial).side = T.DoubleSide;
    const inner = mesh(
      new T.CylinderGeometry(
        1.24,
        1.24,
        3.58,
        64,
        1,
        true,
        Math.PI * 0.5,
        Math.PI * 1.4,
      ),
      dark,
      vessel,
    );
    (inner.material as T.MeshStandardMaterial).side = T.DoubleSide;
    for (const y of [-1.8, 1.8]) {
      ring(vessel, 1.37, 0.1, y);
      bolts(vessel, 1.37, y + 0.08);
    }
    cap(vessel, 1.36, -1.8, steel, true);
    support(vessel, 3.3, 3.3, -2.45);
    for (let i = 0; i < 6; i++)
      mesh(new T.BoxGeometry(0.1, 2.8, 0.13), 0x95abb6, vessel, [
        Math.cos(i) * 1.38,
        -0.1,
        Math.sin(i) * 1.38,
      ]);
    const fuel = part('fuel', [-3.2, -0.25, 0], [0, -1.5, 2.1], [0, 0.6, 0]);
    for (let x = -3; x <= 3; x++)
      for (let z = -3; z <= 3; z++) {
        if (x * x + z * z > 13) continue;
        const r = cylinder(fuel, 0.071, 2.5, [x * 0.25, 0, z * 0.25], orange);
        (r.material as T.MeshStandardMaterial).emissive.set(0x502004);
        (r.material as T.MeshStandardMaterial).emissiveIntensity = 0.25;
        for (const y of [-1.15, -0.35, 0.45, 1.15])
          cylinder(fuel, 0.084, 0.055, [x * 0.25, y, z * 0.25], 0xa5b4b9);
      }
    for (const y of [-1.34, 1.34])
      mesh(new T.BoxGeometry(1.8, 0.12, 1.8), dark, fuel, [0, y, 0]);
    const rods = part('rods', [-3.2, 1.5, 0], [0, 3.1, -0.3], [0, 1.4, 0]);
    cap(rods, 1.36, 0.4);
    ring(rods, 1.4, 0.13, 0.4);
    bolts(rods, 1.4, 0.5);
    for (let x = -1; x <= 1; x++)
      for (let z = -1; z <= 1; z++) {
        cylinder(rods, 0.054, 3.05, [x * 0.5, -0.5, z * 0.5], dark);
        cylinder(rods, 0.095, 0.7, [x * 0.5, 1.2, z * 0.5], steel);
      }
    mesh(new T.BoxGeometry(1.5, 0.12, 1.5), dark, rods, [0, 1.58, 0]);
    const primary = part(
      'primary',
      [0, 0, 0],
      [0, 0.5, -2.6],
      [-1.4, 1.6, -0.9],
    );
    flow(
      primary,
      'primary',
      [
        [-3.0, 0.85, -0.6],
        [-2.2, 0.85, -1.7],
        [-0.2, 0.85, -1.7],
        [0.4, 0.85, -0.6],
        [0.4, -0.7, -0.6],
        [-0.1, -1.05, -1.9],
        [-2.1, -1.05, -1.9],
        [-3.2, -1.05, -0.7],
      ],
      orange,
      40,
    );
    cylinder(primary, 0.42, 1.3, [-1.25, 1.55, -1.8], steel);
    cap(primary, 0.42, 2.2);
    pipe(
      primary,
      [
        [-1.25, 0.9, -1.8],
        [-1.25, 0.55, -1.8],
      ],
      orange,
      0.1,
    );
    cylinder(primary, 0.27, 0.55, [-1.1, -0.6, -1.9], dark);
    cylinder(primary, 0.36, 0.3, [-1.1, -1, -1.9], steel);
  } else {
    const vessel = part(
      'vessel',
      [-3.3, -0.05, 0],
      [-2.4, 0.4, -0.3],
      [0, 1.5, 0],
    );
    const casing = mesh(
      new T.TorusGeometry(1.55, 0.73, 24, 80, Math.PI * 1.45),
      steel,
      vessel,
    );
    casing.rotation.x = Math.PI / 2;
    (casing.material as T.MeshStandardMaterial).side = T.DoubleSide;
    const inner = mesh(
      new T.TorusGeometry(1.55, 0.65, 20, 80, Math.PI * 1.45),
      dark,
      vessel,
    );
    inner.rotation.x = Math.PI / 2;
    (inner.material as T.MeshStandardMaterial).side = T.DoubleSide;
    support(vessel, 4.9, 4.9, -1.7);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      mesh(new T.BoxGeometry(0.2, 1.1, 0.2), dark, vessel, [
        1.6 * Math.cos(a),
        -1.2,
        1.6 * Math.sin(a),
      ]);
    }
    const pl = part('plasma', [-3.3, 0, 0], [0, 1.8, 1.2], [0, 0.55, 1.55]);
    plasma = mesh(
      new T.TorusGeometry(1.55, 0.29, 24, 100),
      cyan,
      pl,
      [0, 0, 0],
      0,
    );
    plasma.rotation.x = Math.PI / 2;
    const pm = plasma.material as T.MeshStandardMaterial;
    pm.emissive.set(0x00b8ca);
    pm.emissiveIntensity = 1.3;
    pm.transparent = true;
    pm.opacity = 0.86;
    fields = new T.Group();
    pl.add(fields);
    for (let j = 0; j < 5; j++) {
      const pts = [];
      for (let i = 0; i <= 240; i++) {
        const a = (i / 240) * Math.PI * 2,
          b = a * 3 + (j * Math.PI * 2) / 5;
        const r = 1.55 + 0.38 * Math.cos(b);
        pts.push([r * Math.cos(a), 0.38 * Math.sin(b), r * Math.sin(a)]);
      }
      pipe(fields, pts, 0x80e1e8, 0.012);
    }
    const coils = part('coils', [-3.3, 0, 0], [0, 2.5, -0.8], [0, 1.6, 0]);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const cg = new T.Group();
      cg.position.set(1.55 * Math.cos(a), 0, 1.55 * Math.sin(a));
      cg.rotation.y = -a;
      coils.add(cg);
      const shape = new T.Shape();
      shape.moveTo(-0.66, -1.05);
      shape.lineTo(-0.66, 1.05);
      shape.quadraticCurveTo(0.0, 1.55, 0.9, 0.8);
      shape.quadraticCurveTo(1.32, 0, 0.9, -0.8);
      shape.quadraticCurveTo(0, -1.55, -0.66, -1.05);
      const hole = new T.Path();
      hole.moveTo(-0.45, -0.84);
      hole.quadraticCurveTo(0, -1.15, 0.7, -0.64);
      hole.quadraticCurveTo(1.02, 0, 0.7, 0.64);
      hole.quadraticCurveTo(0, 1.15, -0.45, 0.84);
      hole.lineTo(-0.45, -0.84);
      shape.holes.push(hole);
      const coil = mesh(
        new T.ExtrudeGeometry(shape, {
          depth: 0.16,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 1,
          bevelSize: 0.025,
          bevelThickness: 0.025,
        }),
        copper,
        cg,
      );
      coil.position.z = -0.08;
    }
    for (const y of [-1.15, 1.15]) ring(coils, 2.3, 0.12, y, copper);
    cylinder(coils, 0.28, 3, [0, 0, 0], dark);
    const blanket = part('blanket', [-3.3, 0, 0], [0, -0.3, 3], [0, 0.4, 1.8]);
    for (let i = 0; i < 15; i++) {
      const a = (i / 15) * Math.PI * 1.45;
      const segment = mesh(
        new T.TorusGeometry(1.55, 0.52, 12, 6, 0.24),
        0xc7a875,
        blanket,
      );
      segment.rotation.x = Math.PI / 2;
      segment.rotation.z = a;
    }
    const div = part(
      'divertor',
      [-3.3, -0.8, 0],
      [0, -1.3, -1.2],
      [0, 0, 1.55],
    );
    ring(div, 1.55, 0.17, 0, dark);
  }
  // Separate heat exchanger and steam circuit; primary and secondary paths never join.
  const steam = part('steam', [0.15, 0, 0], [1, 1.6, -1.8], [0, 1.8, 0]);
  const exchanger = mesh(
    new T.CylinderGeometry(
      0.72,
      0.72,
      3.1,
      48,
      1,
      true,
      Math.PI * 0.55,
      Math.PI * 1.4,
    ),
    steel,
    steam,
  );
  (exchanger.material as T.MeshStandardMaterial).side = T.DoubleSide;
  cap(steam, 0.72, 1.55);
  cap(steam, 0.72, -1.55, steel, true);
  for (const y of [-1.4, 0.8]) ring(steam, 0.75, 0.065, y, dark);
  support(steam, 2, 1.8, -2.1);
  for (let x = -2; x <= 2; x++) {
    pipe(
      steam,
      [
        [x * 0.16, -1.3, -0.22],
        [x * 0.16, 1.1, -0.22],
        [x * 0.16, 1.3, 0],
        [x * 0.16, 1.1, 0.22],
        [x * 0.16, -1.3, 0.22],
      ],
      kind === 'fission' ? orange : cyan,
      0.045,
    );
  }
  flow(
    steam,
    'steam',
    [
      [0, 1.75, 0],
      [0.7, 2.2, 0],
      [2.0, 2.2, 0],
      [2.45, 0.65, 0],
    ],
    0xd5af6e,
    60,
  );
  if (kind === 'fusion')
    flow(
      steam,
      'steam',
      [
        [-2.15, 0.1, -1.5],
        [-1.5, 0.1, -1.9],
        [-0.1, 0.1, -1.9],
        [-0.1, -1.3, -0.4],
        [-1.4, -1.35, -1.8],
        [-2.15, -0.3, -1.4],
      ],
      cyan,
      40,
    );
  const turbine = part(
    'turbine',
    [3.0, -0.35, 0],
    [2.2, 0.3, 1.6],
    [0, 0.8, 0],
  );
  const housing = mesh(
    new T.CylinderGeometry(0.63, 0.9, 2.2, 40, 1, true, 0, Math.PI * 1.35),
    steel,
    turbine,
  );
  housing.rotation.z = Math.PI / 2;
  (housing.material as T.MeshStandardMaterial).side = T.DoubleSide;
  const rotor = new T.Group();
  turbine.add(rotor);
  rotors.push(rotor);
  const shaft = cylinder(rotor, 0.11, 3.5, [0, 0, 0], dark);
  shaft.rotation.z = Math.PI / 2;
  for (let i = 0; i < 7; i++) {
    const x = (i - 3) * 0.29,
      r = 0.47 + i * 0.055;
    const hub = cylinder(rotor, r, 0.05, [x, 0, 0], copper);
    hub.rotation.z = Math.PI / 2;
    for (let j = 0; j < 14; j++) {
      const a = (j / 14) * Math.PI * 2;
      const blade = mesh(new T.BoxGeometry(0.12, 0.19, 0.08), 0xb2a38c, rotor, [
        x,
        (r + 0.05) * Math.cos(a),
        (r + 0.05) * Math.sin(a),
      ]);
      blade.rotation.x = a;
      blade.rotation.y = 0.35;
    }
  }
  support(turbine, 2.8, 1.8, -1.55);
  const genParent =
    kind === 'fission'
      ? part('generator', [5.1, -0.35, 0], [3.1, 1, -0.5], [0, 0.6, 0])
      : turbine;
  const gen = new T.Group();
  genParent.add(gen);
  if (kind === 'fusion') gen.position.x = 2.1;
  const genBody = cylinder(gen, 0.66, 1.4, [0, 0, 0], 0x67968d);
  genBody.rotation.z = Math.PI / 2;
  for (let i = 0; i < 9; i++) {
    const fin = cylinder(gen, 0.69, 0.035, [-0.56 + i * 0.14, 0, 0], 0x507c75);
    fin.rotation.z = Math.PI / 2;
  }
  for (const x of [-0.75, 0.75]) {
    const end = cylinder(gen, 0.56, 0.15, [x, 0, 0], steel);
    end.rotation.z = Math.PI / 2;
  }
  support(gen, 1.8, 1.7, -1.55);
  mesh(new T.BoxGeometry(0.65, 0.25, 0.65), dark, gen, [0, 0.65, 0]);
  pipe(
    gen,
    [
      [0, 0.8, 0],
      [0, 1.2, 0],
      [1.2, 1.2, 0],
      [1.2, 1.6, 0],
    ],
    0x66887b,
    0.04,
  );
  const condenser = part(
    'condenser',
    [1.5, -2, 0],
    [0.5, -1.2, 2.1],
    [1, 0, 0],
  );
  mesh(new T.BoxGeometry(2.5, 0.6, 1.3), blue, condenser, [1, 0, 0]);
  for (let i = 0; i < 9; i++)
    mesh(new T.BoxGeometry(0.035, 0.63, 1.33), 0x99bac9, condenser, [
      i * 0.27 - 0.08,
      0,
      0,
    ]);
  flow(
    condenser,
    'condenser',
    [
      [1.6, 1.4, 0],
      [1.6, 0.35, 0],
      [0.6, 0, 0],
      [-0.7, 0, 0],
      [-1.4, 0.4, 0],
      [-1.35, 0.75, 0],
    ],
    blue,
    80,
  );
  flow(
    condenser,
    'condenser',
    [
      [2.1, -0.3, -0.2],
      [3.3, -0.3, -0.2],
      [3.3, -0.3, 1.5],
      [2.1, -0.3, 1.5],
    ],
    blue,
    80,
  );
  cylinder(condenser, 0.21, 0.3, [-0.6, 0.12, 0.15], dark);
  parts.forEach((p) =>
    p.group.traverse((o) => {
      o.userData.partId = p.id;
    }),
  );
  return { root, parts, flows, rotors, plasma, fields };
}
export type Reaction = { root: T.Group; update: (t: number) => void };
function nucleus(p: number, n: number, scale = 1) {
  const group = new T.Group();
  const total = p + n;
  const geo = new T.SphereGeometry(0.16 * scale, 16, 12);
  const particles = new T.InstancedMesh(geo, mat(0xffffff, 0.24, 0.28), total);
  const transform = new T.Matrix4();
  const protonColor = new T.Color(0xea8151),
    neutronColor = new T.Color(0x56798f);
  const positions: number[][] = [];
  const side = Math.ceil(Math.cbrt(total) * 1.6);
  for (let x = -side; x <= side; x++)
    for (let y = -side; y <= side; y++)
      for (let z = -side; z <= side; z++) {
        positions.push([
          x * 0.27 + (y % 2) * 0.135,
          y * 0.235,
          z * 0.255 + (x % 2) * 0.1,
        ]);
      }
  positions.sort(
    (a, b) =>
      a.reduce((s, x) => s + x * x, 0) - b.reduce((s, x) => s + x * x, 0),
  );
  let protonCount = 0;
  for (let i = 0; i < total; i++) {
    const isProton = Math.floor(((i + 1) * p) / total) > protonCount;
    if (isProton) protonCount++;
    transform.makeTranslation(
      ...(positions[i].map((v) => v * scale) as [number, number, number]),
    );
    particles.setMatrixAt(i, transform);
    particles.setColorAt(i, isProton ? protonColor : neutronColor);
  }
  particles.instanceMatrix.needsUpdate = true;
  if (particles.instanceColor) particles.instanceColor.needsUpdate = true;
  group.add(particles);
  group.userData.protons = p;
  group.userData.neutrons = n;
  return group;
}
export function createReaction(kind: Kind): Reaction {
  const root = new T.Group();
  if (kind === 'fission') {
    const u = nucleus(92, 143, 1.1),
      ba = nucleus(56, 85, 1.1),
      kr = nucleus(36, 56, 1.1);
    root.add(u, ba, kr);
    const neutrons = Array.from({ length: 4 }, () => {
      const m = new T.Mesh(
        new T.SphereGeometry(0.18, 20, 16),
        mat(0x56798f, 0.2),
      );
      root.add(m);
      return m;
    });
    const targets = [
      new T.Vector3(3.6, 1.5, -0.7),
      new T.Vector3(-3.2, -1.8, -0.7),
    ];
    const secondaries = targets.map((target) => {
      const system = new T.Group();
      system.position.copy(target);
      root.add(system);
      const intact = nucleus(92, 143, 0.52),
        barium = nucleus(56, 85, 0.52),
        krypton = nucleus(36, 56, 0.52);
      system.add(intact, barium, krypton);
      const emitted = Array.from({ length: 3 }, () => {
        const m = new T.Mesh(
          new T.SphereGeometry(0.09, 12, 10),
          mat(0x56798f, 0.2),
        );
        system.add(m);
        return m;
      });
      return { intact, barium, krypton, emitted };
    });
    return {
      root,
      update: (t) => {
        const split = Math.max(0, (t - 0.32) / 0.68);
        u.visible = t < 0.34;
        ba.visible = kr.visible = t >= 0.34;
        u.rotation.z = Math.sin(t * 120) * 0.018 * Math.min(1, t / 0.3);
        u.scale.set(
          1 + Math.sin(t * 80) * 0.03,
          1 - Math.sin(t * 80) * 0.03,
          1,
        );
        neutrons[0].visible = t < 0.29;
        neutrons[0].position.set(-4 + Math.min(1, t / 0.29) * 3.8, 0.1, 0.4);
        ba.position.set(-split * 2.1, split * 0.45, 0);
        kr.position.set(split * 2.5, -split * 0.5, 0);
        ba.rotation.y = split;
        kr.rotation.y = -split;
        for (let i = 1; i < 4; i++) {
          neutrons[i].visible = t >= 0.34 && (i === 3 || t < 0.82);
          if (i < 3)
            neutrons[i].position
              .copy(targets[i - 1])
              .multiplyScalar(Math.min(1, Math.max(0, (t - 0.34) / 0.48)));
          else neutrons[i].position.set(-split * 0.5, split * 3.8, 0.45);
        }
        secondaries.forEach((s) => {
          const chain = Math.max(0, (t - 0.82) / 0.18);
          s.intact.visible = t < 0.82;
          s.barium.visible = s.krypton.visible = t >= 0.82;
          s.barium.position.set(-chain * 0.6, chain * 0.25, 0);
          s.krypton.position.set(chain * 0.7, -chain * 0.25, 0);
          s.emitted.forEach((n, i) => {
            n.visible = t >= 0.82;
            const a = (i * Math.PI * 2) / 3;
            n.position.set(
              Math.cos(a) * chain * 1.3,
              Math.sin(a) * chain * 1.3,
              0.25,
            );
          });
        });
      },
    };
  }
  const d = nucleus(1, 1, 2),
    tr = nucleus(1, 2, 2),
    he = nucleus(2, 2, 2);
  root.add(d, tr, he);
  const neutron = new T.Mesh(
    new T.SphereGeometry(0.3, 24, 16),
    mat(0x56798f, 0.2),
  );
  root.add(neutron);
  const halo = new T.Mesh(
    new T.SphereGeometry(0.8, 40, 32),
    new T.MeshBasicMaterial({
      color: 0x23cbd8,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    }),
  );
  root.add(halo);
  return {
    root,
    update: (t) => {
      const fused = t >= 0.48;
      d.visible = tr.visible = !fused;
      he.visible = neutron.visible = halo.visible = fused;
      d.position.set(-2.8 * (1 - Math.min(1, t / 0.48)), 0.05, 0);
      tr.position.set(2.8 * (1 - Math.min(1, t / 0.48)), 0, 0);
      d.rotation.y = t * 4;
      tr.rotation.z = -t * 4;
      const after = Math.max(0, (t - 0.48) / 0.52);
      he.position.set(-after * 0.8, 0, 0);
      he.rotation.y = after * 2;
      neutron.position.set(after * 4.5, after * 1.4, 0);
      halo.scale.setScalar(1 + after * 3);
      (halo.material as T.MeshBasicMaterial).opacity = 0.18 * (1 - after);
    },
  };
}
