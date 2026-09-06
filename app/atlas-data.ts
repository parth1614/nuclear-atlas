export type Kind = 'fission' | 'fusion';
export type Mode = 'assemble' | 'dissect' | 'operate';
export type View = 'machine' | 'nucleus';
export type Part = {
  id: string;
  name: string;
  color: string;
  role: string;
  description: string;
  fact: string;
  source: number;
};
export const SOURCES = [
  {
    title: 'Fission and fusion, explained',
    publisher: 'U.S. Department of Energy',
    url: 'https://www.energy.gov/ne/articles/fission-and-fusion-what-difference',
  },
  {
    title: 'Inside a pressurized water reactor',
    publisher: 'U.S. Nuclear Regulatory Commission',
    url: 'https://www.nrc.gov/reactors/power/pwrs',
  },
  {
    title: 'The systems of a tokamak',
    publisher: 'ITER Organization',
    url: 'https://www.iter.org/components',
  },
  {
    title: 'Deuterium–tritium fusion',
    publisher: 'U.S. Department of Energy',
    url: 'https://www.energy.gov/science/doe-explainsfusion-reactions',
  },
  {
    title: 'What ITER will—and will not—do',
    publisher: 'ITER Organization',
    url: 'https://www.iter.org/fusion-energy/what-will-iter-do',
  },
  {
    title: 'From heat to electricity',
    publisher: 'U.S. Nuclear Regulatory Commission',
    url: 'https://www.nrc.gov/reading-rm/basic-ref/students/science-101/how-does-nuclear-power-plant-make-electricity',
  },
  {
    title: 'Inside protons and neutrons',
    publisher: 'U.S. Department of Energy',
    url: 'https://www.energy.gov/science/doe-explainsprotons',
  },
  {
    title: 'Quarks and gluons',
    publisher: 'U.S. Department of Energy',
    url: 'https://www.energy.gov/science/doe-explainsquarks-and-gluons',
  },
];
export const PARTS: Record<Kind, Part[]> = {
  fission: [
    {
      id: 'fuel',
      name: 'Fuel assemblies',
      color: '#d9672d',
      role: 'THE HEAT SOURCE',
      description:
        'Uranium fuel is held in slender metal rods. Fission releases energy inside the fuel, which transfers heat to the surrounding water.',
      fact: 'A nucleus splits. Its fragments carry away energy.',
      source: 0,
    },
    {
      id: 'rods',
      name: 'Control rods',
      color: '#455b6d',
      role: 'REGULATING THE REACTION',
      description:
        'Neutron-absorbing rods move into or out of the core to help regulate the fission chain reaction.',
      fact: 'Absorbing neutrons reduces the number available for further fission.',
      source: 1,
    },
    {
      id: 'vessel',
      name: 'Reactor vessel',
      color: '#9aaeb9',
      role: 'CONTAINING THE CORE',
      description:
        'A thick steel vessel contains the fuel, internal structures, and pressurized primary water. A cutaway exposes the core in this model.',
      fact: 'Primary water remains liquid under high pressure.',
      source: 1,
    },
    {
      id: 'primary',
      name: 'Primary coolant',
      color: '#db8345',
      role: 'CARRYING THE HEAT',
      description:
        'A closed water circuit carries heat from the core to the steam generator and returns through a pump. A pressurizer helps maintain its pressure.',
      fact: 'Primary water and secondary water do not mix.',
      source: 1,
    },
    {
      id: 'steam',
      name: 'Steam generator',
      color: '#77aebe',
      role: 'EXCHANGING HEAT',
      description:
        'Heat crosses the tube walls into a separate water circuit. This secondary water boils, producing steam for the turbine.',
      fact: 'Heat crosses the boundary. The water stays separate.',
      source: 1,
    },
    {
      id: 'turbine',
      name: 'Steam turbine',
      color: '#b99a70',
      role: 'HEAT BECOMES MOTION',
      description:
        'Expanding steam pushes rows of blades, rotating a shaft connected to the electrical generator.',
      fact: 'The turbine converts energy in steam into mechanical rotation.',
      source: 5,
    },
    {
      id: 'generator',
      name: 'Generator',
      color: '#559586',
      role: 'MOTION BECOMES ELECTRICITY',
      description:
        'The rotating shaft drives a generator. Electromagnetic induction produces electricity for the grid.',
      fact: 'A reactor supplies heat; a generator produces electricity.',
      source: 5,
    },
    {
      id: 'condenser',
      name: 'Condenser & return',
      color: '#67a0bd',
      role: 'CLOSING THE LOOP',
      description:
        'After the turbine, steam cools back into water. A feedwater pump returns it to the steam generator. A separate cooling circuit removes waste heat.',
      fact: 'Not all heat becomes electricity. Some must be rejected.',
      source: 5,
    },
  ],
  fusion: [
    {
      id: 'plasma',
      name: 'Fusion plasma',
      color: '#08adb9',
      role: 'THE REACTION REGION',
      description:
        'Deuterium and tritium nuclei fuse in a very hot plasma, producing a helium nucleus and a fast neutron. Magnetic fields confine the charged particles.',
      fact: 'The neutron has no electric charge and escapes magnetic confinement.',
      source: 3,
    },
    {
      id: 'coils',
      name: 'Magnetic field coils',
      color: '#a88665',
      role: 'SHAPING THE PLASMA',
      description:
        'Toroidal and poloidal magnetic fields work together to guide charged particles around the tokamak. The field lines shown are illustrative.',
      fact: 'Magnets confine charged particles, not the fusion neutrons.',
      source: 2,
    },
    {
      id: 'vessel',
      name: 'Vacuum vessel',
      color: '#97aab4',
      role: 'AN ISOLATED CHAMBER',
      description:
        'The toroidal vacuum chamber provides an isolated environment for the plasma. A section is removed here to reveal the inner systems.',
      fact: 'A tokamak has a doughnut-shaped plasma chamber.',
      source: 2,
    },
    {
      id: 'blanket',
      name: 'Blanket & shielding',
      color: '#c6aa71',
      role: 'CAPTURING ENERGY',
      description:
        'Surrounding structures intercept neutrons and absorb their energy as heat. Future power-plant blankets are also intended to breed tritium from lithium.',
      fact: 'This view represents a conceptual power plant, not ITER.',
      source: 2,
    },
    {
      id: 'divertor',
      name: 'Divertor',
      color: '#526977',
      role: 'EXHAUST & HEAT REMOVAL',
      description:
        'The divertor manages particle exhaust and removes intense heat from the edge of the plasma.',
      fact: 'Removing heat is as important as producing it.',
      source: 2,
    },
    {
      id: 'steam',
      name: 'Heat exchange',
      color: '#74b5c4',
      role: 'HEAT LEAVES THE MACHINE',
      description:
        'In this conceptual plant, coolant would transfer captured fusion heat to a separate steam cycle.',
      fact: 'ITER is a research machine and will not generate electricity.',
      source: 4,
    },
    {
      id: 'turbine',
      name: 'Turbine & generator',
      color: '#559586',
      role: 'A FUTURE POWER CYCLE',
      description:
        'A conceptual steam turbine and generator illustrate how recovered heat could become electricity. They are not part of ITER’s power output.',
      fact: 'Fusion power is not the same as net electricity exported.',
      source: 4,
    },
    {
      id: 'condenser',
      name: 'Cooling & return',
      color: '#67a0bd',
      role: 'CLOSING THE HEAT CYCLE',
      description:
        'A conceptual condenser and return circuit complete the steam cycle, rejecting heat that was not converted to electricity.',
      fact: 'A future fusion plant still needs heat-removal systems.',
      source: 4,
    },
  ],
};
export type Stage = {
  title: string;
  short: string;
  description: string;
  part: string;
  view: View;
};
export const STAGES: Record<Kind, Stage[]> = {
  fission: [
    {
      title: 'A nucleus splits',
      short: 'Reaction',
      description:
        'A neutron is absorbed by uranium-235. The excited nucleus splits into smaller nuclei and releases additional neutrons.',
      part: 'fuel',
      view: 'nucleus',
    },
    {
      title: 'A controlled chain reaction',
      short: 'Heat',
      description:
        'Some released neutrons cause further fissions. Energy from the fragments becomes heat in the fuel. Control rods absorb neutrons to help regulate the reaction.',
      part: 'fuel',
      view: 'machine',
    },
    {
      title: 'Heat travels through water',
      short: 'Coolant',
      description:
        'Pressurized primary water carries heat out of the core. A pump circulates it through the steam generator and back.',
      part: 'primary',
      view: 'machine',
    },
    {
      title: 'A separate circuit makes steam',
      short: 'Steam',
      description:
        'Heat passes through tube walls into secondary water. The circuits stay separate as the secondary water boils and steam travels to the turbine.',
      part: 'steam',
      view: 'machine',
    },
    {
      title: 'Rotation becomes electricity',
      short: 'Electricity',
      description:
        'Steam turns the turbine and generator. Exhaust steam condenses into water and returns, while another cooling circuit removes waste heat.',
      part: 'generator',
      view: 'machine',
    },
  ],
  fusion: [
    {
      title: 'Two light nuclei combine',
      short: 'Reaction',
      description:
        'Deuterium and tritium combine into a helium nucleus and a neutron, releasing energy. This illustrates one fusion reaction, not the full reaction sequence inside the Sun.',
      part: 'plasma',
      view: 'nucleus',
    },
    {
      title: 'Fields confine the plasma',
      short: 'Confinement',
      description:
        'Magnetic fields guide charged particles around the chamber. The electrically neutral neutrons can leave the plasma.',
      part: 'coils',
      view: 'machine',
    },
    {
      title: 'Surrounding structures absorb energy',
      short: 'Heat',
      description:
        'Neutrons transfer energy to the surrounding blanket and shielding. A power plant would need to capture and remove this heat.',
      part: 'blanket',
      view: 'machine',
    },
    {
      title: 'Heat transfers to a power cycle',
      short: 'Steam',
      description:
        'In this conceptual power plant, a heat exchanger transfers energy to a separate steam circuit. ITER itself will not produce electricity.',
      part: 'steam',
      view: 'machine',
    },
    {
      title: 'A possible path to electricity',
      short: 'Electricity',
      description:
        'A future plant could use steam to turn a turbine and generator. This schematic does not claim an operating commercial fusion power plant.',
      part: 'turbine',
      view: 'machine',
    },
  ],
};
export function stageIndex(progress: number) {
  return Math.min(4, Math.max(0, Math.floor(progress / 20)));
}
export function stageProgress(progress: number) {
  const index = stageIndex(progress);
  return Math.min(1, Math.max(0, (progress - index * 20) / 20));
}
export function assemblySeparation(
  mode: Mode,
  progress: number,
  explode: number,
) {
  return mode === 'assemble'
    ? 100 - progress
    : mode === 'dissect'
      ? explode
      : 0;
}
export const FISSION_BALANCE = {
  before: { protons: 92, neutrons: 144 },
  after: [
    { protons: 56, neutrons: 85 },
    { protons: 36, neutrons: 56 },
    { protons: 0, neutrons: 3 },
  ],
};
export const FUSION_BALANCE = {
  before: [
    { protons: 1, neutrons: 1 },
    { protons: 1, neutrons: 2 },
  ],
  after: [
    { protons: 2, neutrons: 2 },
    { protons: 0, neutrons: 1 },
  ],
};
