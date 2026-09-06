# Nuclear Atlas

A 3D educational explorer for nuclear fission and fusion, inspired by the interaction pattern of [Human Atlas](https://github.com/ashemag/human-atlas).

- Assemble and dissect eight independently selectable systems in each machine.
- Inspect, hide, isolate, or label components. Orbit with mouse, touch, or keyboard.
- Follow five stages from a nuclear reaction to a power cycle with play/pause, seeking, replay, and speed controls.
- Compare fission and deuterium–tritium fusion on a shared reaction timeline.
- Responsive layout, source notes, and a graceful WebGL-unavailable message.

The fission machine is a simplified pressurized water reactor. The fusion machine is a simplified tokamak linked to a **conceptual** steam power cycle. ITER itself will not generate electricity. All geometry, field lines, particle positions, and timing are illustrative. This is not an engineering, reactor-kinetics, or plasma simulation.

## Development

Node 22.13+; use the committed npm lockfile.

```
npm ci
npm run dev
npm run typecheck
npm test
npm run lint
npm run build
```

The Three.js models are procedural; no external model downloads or API keys are required. Scientific references are linked in the app and listed in `app/atlas-data.ts`. Sources are the U.S. Department of Energy, NRC, and ITER. Original Human Atlas code and anatomy assets were not reused.

## Validation

The model checks cover finite geometry and particle transforms, component coverage, flow paths, timeline boundaries, assembly endpoints, and reaction accounting. Type checking and the production build are separate checks.

No browser interaction or visual QA was performed in this build. Optional WebMCP tools are feature-detected and register only in supported browsers; a supported validation context was unavailable, so their browser contracts remain unverified.

## Optional WebMCP

`get_nuclear_atlas_state` reads the current state. `explore_nuclear_atlas` selects a process, optionally selects a component, and sets a dissection amount. Invalid input is rejected before changing state. The tools perform only in-page actions and require no external service.
