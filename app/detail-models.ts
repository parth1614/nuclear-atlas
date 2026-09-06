import * as T from 'three';
import type { DetailNode, DetailShape } from './detail-data';
import type { Machine, ModelPart } from './scene-models';
function add(
  parent: T.Group,
  geometry: T.BufferGeometry,
  color: string,
  pos: [number, number, number] = [0, 0, 0],
) {
  const m = new T.Mesh(
    geometry,
    new T.MeshStandardMaterial({
      color,
      metalness: 0.48,
      roughness: 0.32,
      side: T.DoubleSide,
    }),
  );
  m.position.set(...pos);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function cylinder(
  g: T.Group,
  r: number,
  h: number,
  color: string,
  pos: [number, number, number] = [0, 0, 0],
) {
  return add(g, new T.CylinderGeometry(r, r, h, 32), color, pos);
}
function torus(g: T.Group, r: number, t: number, color: string, y = 0) {
  const m = add(g, new T.TorusGeometry(r, t, 12, 64), color, [0, y, 0]);
  m.rotation.x = Math.PI / 2;
  return m;
}
function nucleons(
  g: T.Group,
  p: number,
  n: number,
  center = [0, 0, 0],
  size = 1,
) {
  const count = p + n,
    positions: number[][] = [];
  for (let x = -6; x <= 6; x++)
    for (let y = -6; y <= 6; y++)
      for (let z = -6; z <= 6; z++)
        positions.push([x * 0.32 + (y % 2) * 0.16, y * 0.28, z * 0.3]);
  positions.sort(
    (a, b) =>
      a.reduce((s, x) => s + x * x, 0) - b.reduce((s, x) => s + x * x, 0),
  );
  const instances = new T.InstancedMesh(
    new T.SphereGeometry(0.19 * size, 16, 12),
    new T.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.2,
      roughness: 0.35,
    }),
    count,
  );
  const transform = new T.Matrix4();
  let protons = 0;
  for (let i = 0; i < count; i++) {
    const isProton = Math.floor(((i + 1) * p) / count) > protons;
    if (isProton) protons++;
    transform.makeTranslation(
      ...(positions[i].map((v, j) => v * size + center[j]) as [
        number,
        number,
        number,
      ]),
    );
    instances.setMatrixAt(i, transform);
    instances.setColorAt(i, new T.Color(isProton ? '#eb8553' : '#577c96'));
  }
  instances.instanceMatrix.needsUpdate = true;
  if (instances.instanceColor) instances.instanceColor.needsUpdate = true;
  g.add(instances);
}
function shape(g: T.Group, type: DetailShape, color: string) {
  if (type === 'bundle') {
    for (let x = -2; x <= 2; x++)
      for (let z = -2; z <= 2; z++)
        cylinder(g, 0.095, 4.3, color, [x * 0.4, 0, z * 0.4]);
  } else if (type === 'cladding') {
    add(
      g,
      new T.CylinderGeometry(
        0.65,
        0.65,
        4.2,
        48,
        1,
        true,
        0.65,
        Math.PI * 1.45,
      ),
      color,
    );
    for (const y of [-2.1, 2.1]) torus(g, 0.65, 0.07, color, y);
  } else if (type === 'pellets') {
    for (let i = 0; i < 9; i++) {
      cylinder(g, 0.5, 0.43, color, [0, (i - 4) * 0.46, 0]);
      torus(g, 0.44, 0.025, '#968170', (i - 4) * 0.46 + 0.215);
    }
  } else if (type === 'pellet') {
    cylinder(g, 1.3, 1.9, color);
    for (const y of [-0.95, 0.95]) torus(g, 1.08, 0.055, '#918575', y);
  } else if (type === 'lattice' || type === 'oxygen') {
    if (type === 'lattice') {
      for (const x of [-1, 1])
        for (const y of [-1, 1])
          for (const z of [-1, 1])
            add(g, new T.SphereGeometry(0.23, 16, 12), color, [x, y, z]);
      for (const pos of [
        [0, 0, -1],
        [0, 0, 1],
        [0, -1, 0],
        [0, 1, 0],
        [-1, 0, 0],
        [1, 0, 0],
      ])
        add(
          g,
          new T.SphereGeometry(0.23, 16, 12),
          color,
          pos as [number, number, number],
        );
    }
    for (const x of [-0.5, 0.5])
      for (const y of [-0.5, 0.5])
        for (const z of [-0.5, 0.5])
          add(g, new T.SphereGeometry(0.14, 16, 12), '#63accc', [x, y, z]);
  } else if (type === 'uranium') nucleons(g, 92, 143, [0, 0, 0], 1.4);
  else if (type === 'deuterium') nucleons(g, 1, 1, [0, 0, 0], 3.6);
  else if (type === 'tritium') nucleons(g, 1, 2, [0, 0, 0], 3.6);
  else if (type === 'ions') {
    nucleons(g, 1, 1, [-1, 0, 0], 2.5);
    nucleons(g, 1, 2, [1, 0, 0], 2.5);
  } else if (type === 'atom') {
    nucleons(g, 92, 143, [0, 0, 0], 0.7);
    const m = add(g, new T.SphereGeometry(2.2, 48, 32), '#79a9c0');
    Object.assign(m.material, {
      transparent: true,
      opacity: 0.09,
      depthWrite: false,
    });
  } else if (type === 'electrons') {
    for (let i = 0; i < 40; i++) {
      const a = i * 2.399963,
        r = 1.2 + (i % 4) * 0.3,
        y = (i / 39 - 0.5) * 3.3;
      add(g, new T.SphereGeometry(0.055, 8, 8), color, [
        Math.cos(a) * r,
        y,
        Math.sin(a) * r,
      ]);
    }
  } else if (type === 'plasma') {
    const m = add(g, new T.TorusGeometry(1.65, 0.36, 24, 96), color);
    m.rotation.x = Math.PI / 2;
    const material = m.material as T.MeshStandardMaterial;
    material.emissive.set(color);
    material.emissiveIntensity = 0.7;
  } else if (type === 'coil' || type === 'windings') {
    for (let i = 0; i < 12; i++) {
      const m = add(g, new T.TorusGeometry(1.5, 0.09, 10, 64), color, [
        0,
        (i - 6) * 0.12,
        0,
      ]);
      m.rotation.x = Math.PI / 2;
    }
  } else if (type === 'cable' || type === 'strands' || type === 'filaments') {
    const count = type === 'filaments' ? 49 : 19;
    for (let i = 0; i < count; i++) {
      const a = i * 2.399963,
        r = 0.19 * Math.sqrt(i),
        points = [];
      for (let j = 0; j <= 40; j++) {
        const y = (j / 40) * 4 - 2;
        points.push(
          new T.Vector3(
            Math.cos(a + y * 0.45) * r,
            y,
            Math.sin(a + y * 0.45) * r,
          ),
        );
      }
      const curve = new T.CatmullRomCurve3(points);
      add(
        g,
        new T.TubeGeometry(
          curve,
          40,
          type === 'filaments' ? 0.05 : 0.1,
          8,
          false,
        ),
        i % 3 === 0 ? '#7596aa' : color,
      );
    }
  } else if (type === 'shell') {
    add(
      g,
      new T.CylinderGeometry(1.7, 1.7, 4.5, 48, 1, true, 0.7, Math.PI * 1.4),
      color,
    );
    for (const y of [-2.25, 2.25]) torus(g, 1.72, 0.12, color, y);
  } else if (type === 'plate') {
    add(g, new T.BoxGeometry(3, 0.2, 3), color);
    for (let x = -2; x <= 2; x++)
      for (let z = -2; z <= 2; z++)
        cylinder(g, 0.08, 0.24, '#4f6573', [x * 0.53, 0, z * 0.53]);
  } else if (type === 'grid') {
    for (const y of [-1.6, 0, 1.6])
      for (let i = -3; i <= 3; i++) {
        add(g, new T.BoxGeometry(2.7, 0.16, 0.04), color, [0, y, i * 0.44]);
        add(g, new T.BoxGeometry(0.04, 0.16, 2.7), color, [i * 0.44, y, 0]);
      }
  } else if (type === 'pipes') {
    for (let i = -3; i <= 3; i++) {
      const pts = [
        new T.Vector3(i * 0.24, -2, -0.45),
        new T.Vector3(i * 0.24, 1.5, -0.45),
        new T.Vector3(i * 0.24, 1.8, 0),
        new T.Vector3(i * 0.24, 1.5, 0.45),
        new T.Vector3(i * 0.24, -2, 0.45),
      ];
      add(
        g,
        new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.07, 8, false),
        color,
      );
    }
  } else if (type === 'water') {
    const m = cylinder(g, 0.45, 3.7, color);
    Object.assign(m.material, {
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    });
    for (let i = 0; i < 12; i++)
      add(g, new T.SphereGeometry(0.1, 10, 8), color, [
        Math.sin(i) * 0.22,
        (i - 6) * 0.28,
        Math.cos(i) * 0.22,
      ]);
  } else if (type === 'impeller' || type === 'blades') {
    cylinder(g, 0.35, 1, color);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const m = add(g, new T.BoxGeometry(0.22, 0.22, 1.15), color, [
        Math.cos(a) * 0.88,
        0,
        Math.sin(a) * 0.88,
      ]);
      m.rotation.y = -a + Math.PI / 2;
      m.rotation.z = 0.25;
    }
  } else if (type === 'shaft') {
    cylinder(g, 0.25, 4.8, color);
    for (const y of [-1.6, 1.6]) cylinder(g, 0.48, 0.35, color, [0, y, 0]);
  } else if (type === 'blocks' || type === 'blanket' || type === 'divertor') {
    for (let x = -2; x <= 2; x++)
      for (let y = -1; y <= 1; y++)
        add(g, new T.BoxGeometry(0.49, 0.7, 0.8), color, [
          x * 0.54,
          y * 0.77,
          0,
        ]);
  } else if (type === 'absorber') {
    for (let i = -1; i <= 1; i++) cylinder(g, 0.18, 4, color, [i * 0.55, 0, 0]);
  } else if (type === 'spring') {
    const points = [];
    for (let i = 0; i <= 180; i++) {
      const a = (i / 180) * Math.PI * 12;
      points.push(
        new T.Vector3(
          Math.cos(a) * 0.3,
          (i / 180) * 1.2 - 0.6,
          Math.sin(a) * 0.3,
        ),
      );
    }
    add(
      g,
      new T.TubeGeometry(new T.CatmullRomCurve3(points), 180, 0.055, 8, false),
      color,
    );
    cylinder(g, 0.6, 0.2, color, [0, 0.8, 0]);
  }
}
export function createDetailModel(node: DetailNode): Machine {
  const root = new T.Group(),
    parts: ModelPart[] = [];
  const children = node.children.length ? node.children : [node];
  for (const child of children) {
    const group = new T.Group();
    root.add(group);
    const terminal = !node.children.length;
    group.position.set(
      ...((terminal ? [0, 0, 0] : child.position) as [number, number, number]),
    );
    shape(group, child.shape, child.color);
    group.traverse((o) => {
      o.userData.partId = child.id;
    });
    parts.push({
      id: child.id,
      group,
      base: group.position.clone(),
      offset: new T.Vector3(...child.offset),
      anchor: new T.Vector3(0, 1.3, 0),
    });
  }
  return { root, parts, flows: [], rotors: [] };
}
