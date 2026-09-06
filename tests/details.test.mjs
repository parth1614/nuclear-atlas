import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  DETAIL_ROOTS,
  depthRoute,
  depthSample,
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
  assert.equal(chain.at(-1).children.length, 0);
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

test('One depth sweep visits every fission level and reverses to the assembled machine', () => {
  const route = depthRoute('fission');
  assert.equal(route.length, 8);
  const visited = new Set();
  for (let p = 0; p <= 100; p += 0.5)
    visited.add(depthSample(route, p).path.join('/'));
  assert.equal(visited.size, route.length);
  assert.equal(depthSample(route, 100).node.shape, 'uranium');
  for (let p = 100; p >= 0; p -= 0.5)
    assert.ok(visited.has(depthSample(route, p).path.join('/')));
  assert.deepEqual(depthSample(route, 0).path, []);
  assert.equal(depthSample(route, 0).separation, 0);
});
test('Fusion depth reaches nuclei; alternate paths preserve tritium and magnet interiors', () => {
  assert.equal(depthSample(depthRoute('fusion'), 100).node.shape, 'deuterium');
  assert.equal(
    depthSample(depthRoute('fusion', ['plasma', 'fuel-ions', 'tritium']), 100)
      .node.shape,
    'tritium',
  );
  assert.equal(
    depthSample(depthRoute('fusion', ['coils']), 100).node.id,
    'filaments',
  );
});
test('All system sliders reach their innermost modeled component without crossing branches', () => {
  for (const kind of ['fission', 'fusion'])
    for (const root of DETAIL_ROOTS[kind]) {
      const route = depthRoute(kind, [root.id]);
      assert.equal(route[1].node.id, root.id);
      assert.equal(depthSample(route, 100).node.children.length, 0);
      for (const level of route.slice(1))
        assert.equal(resolveDetailPath(kind, level.path).at(-1), level.node);
    }
});
