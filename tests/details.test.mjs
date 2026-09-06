import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  DETAIL_ROOTS,
  depthRoute,
  depthSample,
  depthForPath,
  resolveDetailPath,
  canEnter,
  dragCompletion,
} from '../app/detail-data.ts';
import { createDetailModel } from '../app/detail-models.ts';
import { PARTS } from '../app/atlas-data.ts';
const visit = (nodes, fn, path = []) =>
  nodes.forEach((node) => {
    fn(node, [...path, node.id]);
    visit(node.children, fn, [...path, node.id]);
  });
test('Every reactor system has a nested dissection and every path resolves', () => {
  for (const kind of ['fission', 'fusion']) {
    assert.deepEqual(
      DETAIL_ROOTS[kind].map((n) => n.id).sort(),
      PARTS[kind].map((n) => n.id).sort(),
    );
    for (const root of DETAIL_ROOTS[kind]) assert.ok(root.children.length > 0);
    visit(DETAIL_ROOTS[kind], (node, path) => {
      assert.equal(resolveDetailPath(kind, path).at(-1), node);
      assert.equal(
        new Set(node.children.map((n) => n.id)).size,
        node.children.length,
      );
      assert.ok(node.description.length > 20);
    });
  }
});
test('The fission route reaches a U-235 nucleus through ceramic fuel', () => {
  const path = [
    'fuel',
    'fuel-rods',
    'pellets',
    'pellet',
    'crystal',
    'uranium-atom',
    'nucleus',
  ];
  const chain = resolveDetailPath('fission', path);
  assert.equal(chain.length, 7);
  assert.equal(chain.at(-1).shape, 'uranium');
  assert.equal(chain.at(-1).reaction, true);
  assert.deepEqual(
    chain.at(-1).children.map((n) => n.id),
    ['proton', 'neutron'],
  );
});
test('Fusion separates fuel nuclei from electrons, and coil cables from plasma', () => {
  const nuclei = resolveDetailPath('fusion', ['plasma', 'fuel-ions']);
  assert.deepEqual(
    nuclei.at(-1).children.map((n) => n.shape),
    ['deuterium', 'tritium'],
  );
  assert.ok(nuclei.at(-1).children.every((n) => n.reaction));
  const cable = resolveDetailPath('fusion', [
    'coils',
    'winding-pack',
    'cable',
    'strands',
    'filaments',
  ]);
  assert.equal(cable.length, 5);
  assert.equal(cable.at(-1).reaction, undefined);
});
test('An unknown child cannot cross into a different branch', () => {
  assert.equal(resolveDetailPath('fission', ['fuel', 'coils']).length, 1);
  assert.equal(resolveDetailPath('fusion', ['fuel']).length, 0);
});
test('Short drags select or move a part; a deliberate pull reaches the open threshold', () => {
  assert.equal(dragCompletion(0, 0), 0);
  assert.ok(dragCompletion(25, 25) < 1);
  assert.equal(dragCompletion(90, 0), 1);
  assert.equal(dragCompletion(-90, 0), 1);
  assert.equal(dragCompletion(0, 200), 1);
  assert.equal(canEnter({ children: [] }), false);
});
for (const kind of ['fission', 'fusion'])
  test(`${kind}: all nested geometries and separation endpoints are finite`, () => {
    const geometries = new Set(),
      materials = new Set();
    let count = 0;
    visit(DETAIL_ROOTS[kind], (node) => {
      const m = createDetailModel(node);
      assert.ok(m.parts.length > 0);
      m.root.traverse((o) => {
        if (o instanceof T.Mesh) {
          geometries.add(o.geometry);
          materials.add(o.material);
          assert.ok(
            [...o.geometry.attributes.position.array].every(Number.isFinite),
          );
          if (o instanceof T.InstancedMesh)
            assert.ok([...o.instanceMatrix.array].every(Number.isFinite));
        }
      });
      for (const p of m.parts) {
        p.group.position.copy(p.base).add(p.offset);
        assert.ok(p.group.position.toArray().every(Number.isFinite));
      }
      const bounds = new T.Box3().setFromObject(m.root);
      assert.ok(bounds.getSize(new T.Vector3()).length() < 25);
      count++;
    });
    assert.ok(count > 30);
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  });

for (const kind of ['fission', 'fusion']) {
  test(`${kind}: the fixed slider tour opens all eight systems before any atomic close-up`, () => {
    const route = depthRoute(kind);
    assert.equal(route[0].phase, 'machine');
    assert.equal(route[0].end, 15);
    const components = route.filter((level) => level.phase === 'components');
    assert.deepEqual(
      [...new Set(components.map((level) => level.path[0]))],
      DETAIL_ROOTS[kind].map((n) => n.id),
    );
    assert.deepEqual(
      [...new Set(components.map((level) => level.systemIndex))],
      [0, 1, 2, 3, 4, 5, 6, 7],
    );
    assert.ok(
      components.every((level) => level.start >= 15 && level.end <= 75),
    );
    const particles = route.filter((level) => level.phase === 'particles');
    assert.equal(particles[0].start, 75);
    assert.ok(particles.every((level) => level.start >= 75));
    assert.equal(route.at(-1).node.shape, 'neutron');
    assert.ok(route.at(-1).node.children.some((n) => n.shape === 'quark'));
    for (let i = 1; i < route.length; i++)
      assert.ok(Math.abs(route[i - 1].end - route[i].start) < 1e-8);
  });
  test(`${kind}: continuous dragging visits every stop in both directions`, () => {
    const route = depthRoute(kind);
    const visited = new Set();
    for (let p = 0; p <= 100; p += 0.05)
      visited.add(depthSample(route, p).index);
    assert.equal(visited.size, route.length);
    for (let p = 100; p >= 0; p -= 0.05) {
      const sample = depthSample(route, p);
      assert.ok(visited.has(sample.index));
      assert.ok(sample.separation >= 0 && sample.separation <= 100);
    }
    assert.deepEqual(depthSample(route, 0).path, []);
    assert.equal(depthSample(route, 100).index, route.length - 1);
    for (const level of route)
      assert.equal(
        depthSample(route, level.start).path.join('/'),
        level.path.join('/'),
      );
  });
  test(`${kind}: component jumps retain the complete itinerary and aliases resolve`, () => {
    for (const root of DETAIL_ROOTS[kind]) {
      const value = depthForPath(kind, [root.id]);
      assert.equal(depthSample(depthRoute(kind), value).path[0], root.id);
      assert.equal(
        depthRoute(kind).filter((level) => level.path.length === 1).length,
        8,
      );
    }
    const alias =
      kind === 'fission'
        ? ['vessel', 'fuel', 'fuel-rods']
        : ['vessel', 'plasma', 'fuel-ions'];
    assert.equal(
      depthSample(depthRoute(kind), depthForPath(kind, alias)).node,
      resolveDetailPath(kind, alias).at(-1),
    );
  });
}
test('Nuclear dissection preserves each isotope’s complete proton and neutron counts', () => {
  for (const [kind, path, counts] of [
    [
      'fission',
      [
        'fuel',
        'fuel-rods',
        'pellets',
        'pellet',
        'crystal',
        'uranium-atom',
        'nucleus',
      ],
      [92, 143],
    ],
    ['fusion', ['plasma', 'fuel-ions', 'deuterium'], [1, 1]],
    ['fusion', ['plasma', 'fuel-ions', 'tritium'], [1, 2]],
  ]) {
    const model = createDetailModel(resolveDetailPath(kind, path).at(-1));
    assert.deepEqual(
      model.parts.map((p) => p.id),
      ['proton', 'neutron'],
    );
    assert.deepEqual(
      model.parts.map((p) => p.group.children[0].count),
      counts,
    );
    model.root.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.geometry.dispose();
        o.material.dispose();
      }
    });
  }
});
test('The final close-ups show the correct valence content of both nucleons', () => {
  const core = resolveDetailPath('fusion', [
    'plasma',
    'fuel-ions',
    'deuterium',
  ]).at(-1);
  const flavors = (node) =>
    node.children
      .filter((n) => n.shape === 'quark')
      .map((n) => n.name.split(' ')[0]);
  assert.deepEqual(flavors(core.children[0]), ['Up', 'Up', 'Down']);
  assert.deepEqual(flavors(core.children[1]), ['Up', 'Down', 'Down']);
  assert.ok(
    core.children.every((n) => n.children.some((c) => c.shape === 'gluons')),
  );
});

test('Hardware views retain the pellet and plasma exterior until the particle chapter', () => {
  for (const kind of ['fission', 'fusion']) {
    for (const level of depthRoute(kind).filter((level) => level.overview)) {
      const model = createDetailModel(level.node, true);
      assert.deepEqual(
        model.parts.map((p) => p.id),
        [level.node.id],
      );
      model.root.traverse((o) => {
        if (o instanceof T.Mesh) {
          o.geometry.dispose();
          o.material.dispose();
        }
      });
    }
  }
});
