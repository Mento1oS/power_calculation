/** @format */

const calcLineParams = (step, r0, x0) => {
  return {
    r: r0 * step,
    x: x0 * step,
  };
};

const calcReactPartByCos = (act, cos) => {
  return act * Math.sqrt(1 / (cos * cos) - 1);
};

const calcDeltaPower = (
  activeRes,
  reactiveRes,
  voltage,
  activePower,
  reactivePower
) => {
  const squaredPowerByVoltage =
    (Math.pow(activePower, 2) + Math.pow(reactivePower, 2)) /
    Math.pow(voltage, 2);
  return {
    active: squaredPowerByVoltage * activeRes,
    reactive: squaredPowerByVoltage * reactiveRes,
  };
};

const calcDeltaVoltage = (
  activeRes,
  reactiveRes,
  voltage,
  activePower,
  reactivePower
) => {
  return (activePower * activeRes + reactivePower * reactiveRes) / voltage;
};

const CHARGE_POWER_FACTOR = 0.985;

const CHARGE_STATION_ACTIVE_POWER = 10000;

const CHARGE_STATION = {
  activePower: CHARGE_STATION_ACTIVE_POWER,
  reactivePower: calcReactPartByCos(
    CHARGE_STATION_ACTIVE_POWER,
    CHARGE_POWER_FACTOR
  ),
};

const GAS_POWER_FACTOR = 0.9;

const GAS_ACTIVE_POWER = 40000;

const GAS_STATION = {
  activePower: GAS_ACTIVE_POWER,
  reactivePower: calcReactPartByCos(GAS_ACTIVE_POWER, GAS_POWER_FACTOR),
};

const BULB_POWER_FACTOR = 0.95;

const STEPS = [34, 37, 40];

const BULB_POWERS = [250, 100, 150];

const GAS_STATION_RATE = [1470, 1350, 1250];

const CHARGE_STATION_RATE = [2940, 2700, 2500];

const LINE_PARAMS = [
  {
    r0: 0.000125,
    x0: 0.0000705,
  },
  {
    r0: 0.000125,
    x0: 0.0000705,
  },
  {
    r0: 0.000125,
    x0: 0.0000705,
  },
];

const SCHEME_PARAMS = [
  {
    name: "автомагистраль, 4 полосы, класс 1А, двусторонняя прямоугольная расстановка",
    lines: 4,
    sides: 2, //сколько сторон дороги содержит опоры освещения
    step: STEPS[0],
    power: {
      activePower: BULB_POWERS[0],
      reactivePower: calcReactPartByCos(BULB_POWERS[0], BULB_POWER_FACTOR),
    },
    line: calcLineParams(STEPS[0], LINE_PARAMS[0].r0, LINE_PARAMS[0].x0),
    gasStationRate: GAS_STATION_RATE[0],
    chargeStationRate: CHARGE_STATION_RATE[0],
  },
  {
    name: "обычного типа, 4 полосы, класс 2, двусторонняя шахматная расстановка",
    lines: 4,
    sides: 2, //сколько сторон дороги содержит опоры освещения
    step: STEPS[1],
    power: {
      activePower: BULB_POWERS[1],
      reactivePower: calcReactPartByCos(BULB_POWERS[1], BULB_POWER_FACTOR),
    },
    line: calcLineParams(STEPS[1], LINE_PARAMS[1].r0, LINE_PARAMS[1].x0),
    gasStationRate: GAS_STATION_RATE[1],
    chargeStationRate: CHARGE_STATION_RATE[1],
  },
  {
    name: "обычного типа, 2 полосы, класс 3, односторонняя расстановка",
    lines: 2,
    sides: 1, //сколько сторон дороги содержит опоры освещения
    step: STEPS[2],
    power: {
      activePower: BULB_POWERS[2],
      reactivePower: calcReactPartByCos(BULB_POWERS[2], BULB_POWER_FACTOR),
    },
    line: calcLineParams(STEPS[2], LINE_PARAMS[2].r0, LINE_PARAMS[2].x0),
    gasStationRate: GAS_STATION_RATE[2],
    chargeStationRate: CHARGE_STATION_RATE[2],
  },
];

const POWER_FLOW = {
  activePower: 210000,
  reactivePower: 50000,
};

const HEAD_VOLTAGE = 400;

const END_VOLTAGE = 380;

const calculateRoadNetFromStart = (scheme, powerFlow, headVoltage) => {
  let iteration = 0;
  const changingPowerFlow = {
    activePower: powerFlow.activePower / scheme.sides,
    reactivePower: powerFlow.reactivePower / scheme.sides,
  }; // учитываем тут то, что опоры могут находиться с двух сторон, поэтому мощность будет распределяться по опорам поровну
  let changingVoltage = headVoltage;
  let gasStations = 0;
  let chargingStations = 0;
  let powerLoss = 0;
  while (
    changingVoltage /*условие остановки итераций */ >
    380 /*changingPowerFlow.activePower > scheme.power.activePower*/
  ) {
    const deltaPower = calcDeltaPower(
      scheme.line.r,
      scheme.line.x,
      changingVoltage,
      changingPowerFlow.activePower,
      changingPowerFlow.reactivePower
    );
    powerLoss += deltaPower.active;
    const deltaVoltage = calcDeltaVoltage(
      scheme.line.r,
      scheme.line.x,
      changingVoltage,
      changingPowerFlow.activePower,
      changingPowerFlow.reactivePower
    );
    changingVoltage = changingVoltage - deltaVoltage;
    changingPowerFlow.activePower =
      changingPowerFlow.activePower -
      deltaPower.active -
      scheme.power.activePower;
    changingPowerFlow.reactivePower =
      changingPowerFlow.reactivePower -
      deltaPower.reactive -
      scheme.power.reactivePower;
    if (iteration === scheme.gasStationRate) {
      gasStations++;
      changingPowerFlow.activePower =
        changingPowerFlow.activePower - GAS_STATION.activePower;
      changingPowerFlow.reactivePower =
        changingPowerFlow.reactivePower - GAS_STATION.reactivePower;
    }
    if (iteration === scheme.gasStationRate) {
      chargingStations++;
      changingPowerFlow.activePower =
        changingPowerFlow.activePower - CHARGE_STATION.activePower;
      changingPowerFlow.reactivePower =
        changingPowerFlow.reactivePower - CHARGE_STATION.reactivePower;
    }
    iteration++;
  }
  const distance = iteration * scheme.step;
  return {
    changingPowerFlow,
    changingVoltage,
    distance,
    gasStations,
    chargingStations,
    powerLoss,
  };
};

const calculateRoadNetFromEnd = (scheme, endVoltage) => {
  let iteration = 0;
  const changingPowerFlow = {
    activePower: scheme.power.activePower,
    reactivePower: scheme.power.reactivePower,
  }; // учитываем тут то, что опоры могут находиться с двух сторон, поэтому мощность будет распределяться по опорам поровну
  let changingVoltage = endVoltage;
  let gasStations = 0;
  let chargingStations = 0;
  let powerLoss = 0;
  while (
    scheme.step * (iteration + 1) /*условие остановки итераций */ <=
    10000 /*changingPowerFlow.activePower > scheme.power.activePower*/
  ) {
    const deltaPower = calcDeltaPower(
      scheme.line.r,
      scheme.line.x,
      changingVoltage,
      changingPowerFlow.activePower,
      changingPowerFlow.reactivePower
    );
    powerLoss += deltaPower.active;
    const deltaVoltage = calcDeltaVoltage(
      scheme.line.r,
      scheme.line.x,
      changingVoltage,
      changingPowerFlow.activePower,
      changingPowerFlow.reactivePower
    );
    changingVoltage = changingVoltage + deltaVoltage;
    changingPowerFlow.activePower =
      changingPowerFlow.activePower +
      deltaPower.active +
      scheme.power.activePower;
    changingPowerFlow.reactivePower =
      changingPowerFlow.reactivePower +
      deltaPower.reactive +
      scheme.power.reactivePower;
    if (iteration === scheme.gasStationRate) {
      gasStations++;
      changingPowerFlow.activePower =
        changingPowerFlow.activePower + GAS_STATION.activePower;
      changingPowerFlow.reactivePower =
        changingPowerFlow.reactivePower + GAS_STATION.reactivePower;
    }
    if (iteration === scheme.gasStationRate) {
      chargingStations++;
      changingPowerFlow.activePower =
        changingPowerFlow.activePower + CHARGE_STATION.activePower;
      changingPowerFlow.reactivePower =
        changingPowerFlow.reactivePower + CHARGE_STATION.reactivePower;
    }
    iteration++;
  }
  const distance = iteration * scheme.step;
  return {
    changingPowerFlow,
    changingVoltage,
    distance,
    gasStations,
    chargingStations,
    powerLoss,
    iteration,
    lossPercent: (100 * powerLoss) / changingPowerFlow.activePower,
  };
};

// const calculatedFromStart = calculateRoadNetFromStart(
//   SCHEME_PARAMS[0],
//   POWER_FLOW,
//   HEAD_VOLTAGE
// );
// console.log(calculatedFromStart);

const calculatedFromEnd = calculateRoadNetFromEnd(
  SCHEME_PARAMS[2],
  END_VOLTAGE
);

console.log(calculatedFromEnd);
