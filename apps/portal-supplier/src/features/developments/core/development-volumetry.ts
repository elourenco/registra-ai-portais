interface DeriveVerticalVolumetryInput {
  totalTowers?: number;
  totalUnits?: number;
}

export interface DerivedVerticalVolumetry {
  totalFloors: number;
  unitsPerFloor: number;
}

export function deriveVerticalVolumetry({
  totalTowers,
  totalUnits,
}: DeriveVerticalVolumetryInput): DerivedVerticalVolumetry | null {
  if (!totalTowers || totalTowers < 1 || !totalUnits || totalUnits < 1) {
    return null;
  }

  const unitsPerTower = Math.ceil(totalUnits / totalTowers);
  const totalFloors = Math.max(1, Math.round(Math.sqrt(unitsPerTower)));
  const unitsPerFloor = Math.max(1, Math.ceil(unitsPerTower / totalFloors));

  return {
    totalFloors,
    unitsPerFloor,
  };
}
