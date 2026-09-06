import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createMachine, createReaction } from '../app/scene-models.ts';
import {
  PARTS,
  STAGES,
  stageIndex,
  assemblySeparation,
  FISSION_BALANCE,
  FUSION_BALANCE,
} from '../app/atlas-data.ts';
const total = (parts) =>
  parts.reduce(
    (s, p) => ({
      protons: s.protons + p.protons,
      neutrons: s.neutrons + p.neutrons,
    }),
    { protons: 0, neutrons: 0 },
  );
test('Example reactions conserve protons and nucleons', () => {
  assert.deepEqual(FISSION_BALANCE.before, total(FISSION_BALANCE.after));
  assert.deepEqual(total(FUSION_BALANCE.before), total(FUSION_BALANCE.after));
});
test('The journey ends on electricity, with valid component references', () => {
  for (const kind of ['fission', 'fusion']) {
    assert.equal(STAGES[kind].length, 5);
    for (const stage of STAGES[kind])
      assert.ok(PARTS[kind].some((p) => p.id === stage.part));
    assert.equal(STAGES[kind][stageIndex(100)].short, 'Electricity');
  }
  assert.equal(stageIndex(-1), 0);
  assert.equal(stageIndex(19.9), 0);
  assert.equal(stageIndex(20), 1);
  assert.equal(stageIndex(100), 4);
});
test('Assembly and dissection reach opposite endpoints', () => {
  assert.equal(assemblySeparation('assemble', 0, 70), 100);
  assert.equal(assemblySeparation('assemble', 100, 70), 0);
  assert.equal(assemblySeparation('dissect', 100, 70), 70);
  assert.equal(assemblySeparation('operate', 40, 70), 0);
});
for (const kind of ['fission', 'fusion']) {
  test(`${kind}: all eight selectable systems have finite geometry and valid flow paths`, () => {
    const m = createMachine(kind);
    assert.deepEqual(
      m.parts.map((p) => p.id).sort(),
      PARTS[kind].map((p) => p.id).sort(),
    );
    let vertices = 0;
    m.root.traverse((o) => {
      if (o instanceof T.Mesh) {
        assert.ok(PARTS[kind].some((p) => p.id === o.userData.partId));
        const pos = o.geometry.getAttribute('position');
        for (const value of pos.array) assert.ok(Number.isFinite(value));
        vertices += pos.count;
      }
    });
    assert.ok(vertices > 1000);
    for (const separation of [0, 0.18, 0.5, 1]) {
      for (const p of m.parts)
        p.group.position.copy(p.base).addScaledVector(p.offset, separation);
      const bounds = new T.Box3().setFromObject(m.root);
      for (const value of [...bounds.min.toArray(), ...bounds.max.toArray()])
        assert.ok(Number.isFinite(value));
      assert.ok(bounds.getSize(new T.Vector3()).length() < 30);
    }
    for (const f of m.flows)
      for (const t of [0, 0.25, 0.5, 0.75, 1])
        assert.ok(f.curve.getPointAt(t).toArray().every(Number.isFinite));
  });
  test(`${kind}: reaction animation stays finite before, during, and after collision`, () => {
    const reaction = createReaction(kind);
    for (let i = 0; i <= 100; i++) {
      reaction.update(i / 100);
      reaction.root.updateMatrixWorld(true);
      reaction.root.traverse((o) =>
        assert.ok(o.matrixWorld.elements.every(Number.isFinite)),
      );
    }
    const visible = reaction.root.children.filter((c) => c.visible);
    assert.ok(visible.length >= 2);
  });
}
