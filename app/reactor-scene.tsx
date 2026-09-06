'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createMachine, createReaction } from './scene-models';
import { PARTS, type Kind, type View } from './atlas-data';
import { createDetailModel } from './detail-models';
import { dragCompletion, type DetailNode } from './detail-data';
export type SceneProps = {
  kind: Kind;
  explode: number;
  view?: View;
  progress?: number;
  operating?: boolean;
  playing?: boolean;
  selected?: string | null;
  hidden?: string[];
  isolated?: boolean;
  labels?: boolean;
  rotation?: boolean;
  cameraView?: 'perspective' | 'front' | 'top';
  reset?: number;
  onSelect?: (id: string) => void;
  compact?: boolean;
  detailNode?: DetailNode;
  overview?: boolean;
  dragToOpen?: boolean;
  enterable?: string[];
  onDive?: (id: string) => void;
};
export default function ReactorScene(props: SceneProps) {
  const mount = useRef<HTMLDivElement>(null);
  const current = useRef(props);
  useLayoutEffect(() => {
    current.current = props;
  }, [props]);
  const {
    kind,
    view = 'machine',
    compact = false,
    detailNode,
    overview = false,
  } = props;
  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    const showError = () => {
      if (host.querySelector('.graphics-error')) return;
      const message = document.createElement('div');
      message.className = 'graphics-error';
      const heading = document.createElement('strong');
      heading.textContent = '3D graphics are unavailable';
      const detail = document.createElement('p');
      detail.textContent =
        'Enable hardware acceleration in your browser and reload. You can still explore the component descriptions and energy stages.';
      message.appendChild(heading);
      message.appendChild(detail);
      host.appendChild(message);
    };
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      showError();
      return;
    }
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(
      view === 'nucleus' ? 34 : 32,
      1,
      0.1,
      160,
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFShadowMap;
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute(
      'aria-label',
      `${detailNode ? detailNode.name + ' close-up' : kind + ' ' + view + ' model'}. Arrow keys rotate, plus and minus zoom. Select parts using the component list.`,
    );
    host.appendChild(renderer.domElement);
    const contextLost = (e: Event) => {
      e.preventDefault();
      showError();
    };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    controls.minPolarAngle = 0.1;
    controls.maxPolarAngle = Math.PI * 0.78;
    controls.minDistance = view === 'nucleus' ? 6 : 9;
    controls.maxDistance = 55;
    const pmrem = new T.PMREMGenerator(renderer),
      room = new RoomEnvironment(),
      env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    room.dispose();
    pmrem.dispose();
    scene.add(new T.HemisphereLight(0xffffff, 0x82949c, 2.1));
    const light = new T.DirectionalLight(0xffffff, 3.0);
    light.position.set(0, 12, 7);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.left = -12;
    light.shadow.camera.right = 12;
    light.shadow.camera.top = 12;
    light.shadow.camera.bottom = -12;
    light.shadow.normalBias = 0.04;
    scene.add(light);
    const fill = new T.DirectionalLight(0xcfe8f6, 1.3);
    fill.position.set(-8, 2, -6);
    scene.add(fill);
    const machine = detailNode
      ? createDetailModel(detailNode, overview)
      : view === 'machine'
        ? createMachine(kind)
        : null;
    const reaction =
      !detailNode && view === 'nucleus' ? createReaction(kind) : null;
    const root = machine?.root ?? reaction!.root;
    scene.add(root);
    const floorY = detailNode ? -5.6 : kind === 'fission' ? -3.3 : -3.2;
    const floor = new T.Mesh(
      new T.PlaneGeometry(50, 50),
      new T.ShadowMaterial({ color: 0x506b79, opacity: 0.12 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = floorY;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new T.GridHelper(28, 56, 0xcad8dc, 0xe0e9eb);
    grid.position.y = floorY - 0.01;
    (grid.material as T.Material).transparent = true;
    (grid.material as T.Material).opacity = 0.54;
    scene.add(grid);
    const orbitRing = new T.Mesh(
      new T.RingGeometry(
        view === 'machine' ? 7.9 : 4.9,
        view === 'machine' ? 7.93 : 4.92,
        128,
      ),
      new T.MeshBasicMaterial({
        color: 0xbacdd3,
        transparent: true,
        opacity: 0.7,
        side: T.DoubleSide,
      }),
    );
    orbitRing.rotation.x = -Math.PI / 2;
    orbitRing.position.y = floorY + 0.01;
    scene.add(orbitRing);
    const labelRoot = document.createElement('div');
    labelRoot.className = 'model-labels';
    host.appendChild(labelRoot);
    const labels = (machine?.parts ?? []).map((p) => {
      const b = document.createElement('button');
      b.className = 'model-label';
      b.textContent =
        (detailNode
          ? detailNode.children.length && !overview
            ? detailNode.children
            : [detailNode]
          : PARTS[kind]
        ).find((x) => x.id === p.id)?.name ?? p.id;
      b.addEventListener('click', () => current.current.onSelect?.(p.id));
      labelRoot.appendChild(b);
      return { part: p, element: b };
    });
    const materials = new Map<
      T.MeshStandardMaterial,
      { color: T.Color; emissive: T.Color; intensity: number }
    >();
    root.traverse((o) => {
      if (o instanceof T.Mesh) {
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach((m) => {
          if (m instanceof T.MeshStandardMaterial)
            materials.set(m, {
              color: m.color.clone(),
              emissive: m.emissive.clone(),
              intensity: m.emissiveIntensity,
            });
        });
      }
    });
    let lastReset = -1,
      lastCamera = '',
      lastSelection = '',
      lastVisibility = '',
      smoothed = current.current.explode / 100,
      raf = 0,
      lastFrame = 0;
    function frameCamera() {
      const w = host!.clientWidth,
        h = host!.clientHeight;
      camera.aspect = w / Math.max(h, 1);
      const horizontalFit = 1 / Math.min(1, camera.aspect);
      const dist =
        (detailNode
          ? detailNode.children.length && !overview
            ? 17
            : 11
          : view === 'machine'
            ? 22
            : 13) * horizontalFit;
      const mode = current.current.cameraView ?? 'perspective';
      const target = new T.Vector3(
        !detailNode && view === 'machine' ? 0.3 : 0,
        !detailNode && view === 'machine' ? -0.3 : 0,
        0,
      );
      controls.target.copy(target);
      if (mode === 'front')
        camera.position.copy(target).add(new T.Vector3(0, 1, dist));
      else if (mode === 'top')
        camera.position.copy(target).add(new T.Vector3(0.01, dist, 0.01));
      else
        camera.position
          .copy(target)
          .add(new T.Vector3(dist * 0.44, dist * 0.35, dist * 0.84));
      camera.updateProjectionMatrix();
      controls.update();
    }
    const resize = () => {
      renderer.setSize(host.clientWidth, host.clientHeight);
      frameCamera();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();
    const raycaster = new T.Raycaster(),
      pointer = new T.Vector2();
    let down = [0, 0];
    const manualOffsets = new Map<string, T.Vector3>();
    let grabbed: { id: string; pointerId: number; start: T.Vector3 } | null =
      null;
    const dragHint = document.createElement('div');
    dragHint.className = 'pull-feedback';
    dragHint.hidden = true;
    host.appendChild(dragHint);
    function pick(e: PointerEvent | MouseEvent) {
      if (!machine) return undefined;
      const r = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster
        .intersectObjects(
          machine.parts.filter((p) => p.group.visible).map((p) => p.group),
          true,
        )
        .find((h) => h.object.userData.partId);
      return hit?.object.userData.partId as string | undefined;
    }
    function mayEnter(id: string) {
      return current.current.enterable?.includes(id) ?? true;
    }
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || !e.isPrimary) return;
      down = [e.clientX, e.clientY];
      const id = pick(e);
      if (id && current.current.dragToOpen) {
        e.stopImmediatePropagation();
        controls.enabled = false;
        renderer.domElement.setPointerCapture(e.pointerId);
        grabbed = {
          id,
          pointerId: e.pointerId,
          start: manualOffsets.get(id)?.clone() ?? new T.Vector3(),
        };
        current.current.onSelect?.(id);
        renderer.domElement.style.cursor = 'grabbing';
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!grabbed || e.pointerId !== grabbed.pointerId) return;
      e.stopImmediatePropagation();
      const dx = e.clientX - down[0],
        dy = e.clientY - down[1];
      const units =
        (2 *
          camera.position.distanceTo(controls.target) *
          Math.tan((camera.fov * Math.PI) / 360)) /
        Math.max(host.clientHeight, 1);
      const delta = new T.Vector3(dx * units, -dy * units, 0)
        .applyQuaternion(camera.quaternion)
        .applyQuaternion(root.getWorldQuaternion(new T.Quaternion()).invert());
      manualOffsets.set(grabbed.id, grabbed.start.clone().add(delta));
      const completion = dragCompletion(dx, dy);
      dragHint.hidden = Math.hypot(dx, dy) < 5;
      dragHint.textContent = mayEnter(grabbed.id)
        ? completion >= 1
          ? 'Release to explore inside'
          : 'Keep pulling to explore inside'
        : 'Move this piece · Reset to reassemble';
      dragHint.style.setProperty('--pull-progress', `${completion * 100}%`);
    };
    const cancelGrab = () => {
      if (grabbed) manualOffsets.set(grabbed.id, grabbed.start);
      grabbed = null;
      controls.enabled = true;
      dragHint.hidden = true;
      renderer.domElement.style.cursor = 'grab';
    };
    const onUp = (e: PointerEvent) => {
      const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]);
      if (grabbed) {
        if (e.pointerId !== grabbed.pointerId) return;
        e.stopImmediatePropagation();
        const id = grabbed.id;
        grabbed = null;
        controls.enabled = true;
        dragHint.hidden = true;
        renderer.domElement.style.cursor = 'grab';
        if (renderer.domElement.hasPointerCapture(e.pointerId))
          renderer.domElement.releasePointerCapture(e.pointerId);
        if (
          dragCompletion(e.clientX - down[0], e.clientY - down[1]) >= 1 &&
          mayEnter(id)
        )
          current.current.onDive?.(id);
        return;
      }
      if (moved <= 5) {
        const id = pick(e);
        if (id) current.current.onSelect?.(id);
      }
    };
    const onDoubleClick = (e: MouseEvent) => {
      const id = pick(e);
      if (id && mayEnter(id)) current.current.onDive?.(id);
    };
    const keyboard = (e: KeyboardEvent) => {
      if (
        [
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          '+',
          '-',
          '=',
        ].includes(e.key)
      ) {
        e.preventDefault();
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight')
          root.rotation.y += e.key === 'ArrowLeft' ? -0.12 : 0.12;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowDown')
          root.rotation.x += e.key === 'ArrowUp' ? -0.08 : 0.08;
        else {
          const dir = camera.position.clone().sub(controls.target);
          dir.multiplyScalar(e.key === '-' ? 1.08 : 0.92);
          dir.clampLength(controls.minDistance, controls.maxDistance);
          camera.position.copy(controls.target).add(dir);
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', onDown, true);
    renderer.domElement.addEventListener('pointermove', onMove, true);
    renderer.domElement.addEventListener('pointercancel', cancelGrab);
    renderer.domElement.addEventListener('dblclick', onDoubleClick);
    renderer.domElement.addEventListener('pointerup', onUp, true);
    renderer.domElement.addEventListener('keydown', keyboard);
    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      if (now - lastFrame < 30) return;
      lastFrame = now;
      const p = current.current;
      if (
        lastReset !== (p.reset ?? 0) ||
        lastCamera !== (p.cameraView ?? 'perspective')
      ) {
        if (lastReset !== (p.reset ?? 0)) manualOffsets.clear();
        lastReset = p.reset ?? 0;
        lastCamera = p.cameraView ?? 'perspective';
        root.rotation.set(0, 0, 0);
        frameCamera();
      }
      controls.autoRotate = !!p.rotation;
      controls.autoRotateSpeed = 0.65;
      controls.update();
      smoothed += (p.explode / 100 - smoothed) * 0.13;
      if (machine) {
        machine.parts.forEach((part) => {
          part.group.position
            .copy(part.base)
            .addScaledVector(part.offset, smoothed)
            .add(manualOffsets.get(part.id) ?? new T.Vector3());
          part.group.visible =
            !(p.hidden ?? []).includes(part.id) &&
            (!p.isolated || part.id === p.selected);
        });
        const selection = p.selected ?? '';
        const visibility = (p.hidden ?? []).join(',') + p.isolated;
        if (lastSelection !== selection || lastVisibility !== visibility) {
          lastSelection = selection;
          lastVisibility = visibility;
          machine.parts.forEach((part) =>
            part.group.traverse((o) => {
              if (o instanceof T.Mesh) {
                const ms = Array.isArray(o.material)
                  ? o.material
                  : [o.material];
                ms.forEach((m) => {
                  if (m instanceof T.MeshStandardMaterial) {
                    const base = materials.get(m);
                    if (base) {
                      m.emissive.copy(base.emissive);
                      m.emissiveIntensity = base.intensity;
                      if (selection === part.id) {
                        m.emissive.set(
                          kind === 'fission' ? 0xa34315 : 0x007886,
                        );
                        m.emissiveIntensity = 0.15;
                      }
                    }
                  }
                });
              }
            }),
          );
        }
        const prog = p.progress ?? 0;
        machine.flows.forEach((f) => {
          f.mesh.visible = !!p.operating && prog >= f.start;
          const point = f.curve.getPointAt((prog / 14 + f.phase) % 1);
          f.mesh.position.copy(point);
        });
        machine.rotors.forEach((r) => {
          r.rotation.x = p.operating && prog >= 80 ? (prog - 80) * 1.5 : 0;
        });
        if (machine.plasma) {
          const m = machine.plasma.material as T.MeshStandardMaterial;
          m.emissiveIntensity = p.operating
            ? 0.9 + Math.sin(prog * 0.8) * 0.18
            : 0.6;
        }
        if (machine.fields)
          machine.fields.visible = !!p.operating || !!p.labels;
        labels.forEach(({ part, element }) => {
          const show =
            (p.labels || part.id === p.selected) && part.group.visible;
          const pos = part.group
            .localToWorld(part.anchor.clone())
            .project(camera);
          element.style.display =
            show && pos.z < 1 && pos.z > -1 ? 'block' : 'none';
          element.style.left = `${(pos.x * 0.5 + 0.5) * host.clientWidth}px`;
          element.style.top = `${(-pos.y * 0.5 + 0.5) * host.clientHeight}px`;
          element.classList.toggle('active', part.id === p.selected);
        });
      }
      if (reaction) {
        const progress = p.progress ?? 0;
        reaction.update(Math.min(1, progress / 20));
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onDown, true);
      renderer.domElement.removeEventListener('pointermove', onMove, true);
      renderer.domElement.removeEventListener('pointercancel', cancelGrab);
      renderer.domElement.removeEventListener('dblclick', onDoubleClick);
      renderer.domElement.removeEventListener('pointerup', onUp, true);
      renderer.domElement.removeEventListener('keydown', keyboard);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      const geometries = new Set<T.BufferGeometry>(),
        mats = new Set<T.Material>();
      scene.traverse((o) => {
        if (o instanceof T.Mesh || o instanceof T.Line) {
          geometries.add(o.geometry);
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            mats.add(m),
          );
        }
      });
      geometries.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      env.dispose();
      renderer.dispose();
      host.replaceChildren();
    };
  }, [kind, view, compact, detailNode, overview]);
  return (
    <div className={`three-stage ${compact ? 'compact' : ''}`} ref={mount} />
  );
}
