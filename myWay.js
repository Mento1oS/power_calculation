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
    (3 * (Math.pow(activePower, 2) + Math.pow(reactivePower, 2))) /
    Math.pow(voltage, 2);
  return {
    active: squaredPowerByVoltage * activeRes,
    reactive: squaredPowerByVoltage * reactiveRes,
  };
};

const calcDeltaVoltage = (activeRes, voltage, activePower, reactivePower) => {
  return (
    (Math.sqrt(Math.pow(activePower, 2) + Math.pow(reactivePower, 2)) *
      activeRes *
      Math.sqrt(3)) /
    voltage
  );
};

const calcTransformerParams = (uk, pk, ix, px, power, voltage) => {
  const rt = (pk * Math.pow(voltage, 2)) / Math.pow(power, 2);
  const xt = ((uk / 100) * Math.pow(voltage, 2)) / power;
  const qx = (ix * power) / 100;
  return {
    rt,
    xt,
    qx,
    px,
  };
};

const iterativeCalculation = (
  epsilon,
  initialVoltage,
  transformer,
  schemePower,
  iteration
) => {
  let error = epsilon;
  let iterableVoltage = initialVoltage;
  let deltaTransformerPower;
  let deltaTransformerVoltage;
  while (error >= epsilon) {
    // console.log(iteration);
    deltaTransformerPower = calcDeltaPower(
      /* здесь мы считаем потери мощности без учёта теряемой на сопротивлении луча трансформатора мощности */
      transformer.activeRes,
      transformer.reactiveRes,
      iterableVoltage,
      schemePower.activePower,
      schemePower.reactivePower
    );

    deltaTransformerVoltage = calcDeltaVoltage(
      /* Здесь мы уже учитываем эту мощность, считаем по верхнему напряжению */
      transformer.activeRes,
      initialVoltage,
      schemePower.activePower + deltaTransformerPower.active,
      schemePower.reactivePower + deltaTransformerPower.reactive
    );
    error = Math.abs(
      (initialVoltage - deltaTransformerVoltage - iterableVoltage) /
        (initialVoltage - deltaTransformerVoltage)
    );
    iterableVoltage = initialVoltage - deltaTransformerVoltage;
  }
  return {
    deltaTransformerPower,
    deltaTransformerVoltage,
  };
};

const EPSILON = 0.00000001;

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
    r0: 0.0068,
    x0: 0.001423,
  },
  {
    r0: 0.0068,
    x0: 0.001423,
  },
  {
    r0: 0.0068,
    x0: 0.001423,
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
  reactivePower: 0,
};

const HEAD_VOLTAGE = 22000;

const END_VOLTAGE = 20000;

const TRANSFORMER_CALCULATED = calcTransformerParams(
  4.5,
  55,
  30,
  40,
  500,
  20000
);

const TRANSFORMER = {
  activeRes: TRANSFORMER_CALCULATED.rt,
  reactiveRes: TRANSFORMER_CALCULATED.xt,
  activePowerLoss: TRANSFORMER_CALCULATED.px,
  reactivePowerLoss: TRANSFORMER_CALCULATED.qx,
  transformCoefficient: 20000 / 380,
};

const calculateRoadNetFromStart = (scheme, powerFlow, headVoltage) => {
  let iteration = 0;
  const changingPowerFlow = {
    activePower: powerFlow.activePower,
    reactivePower: powerFlow.reactivePower,
  }; // учитываем тут то, что опоры могут находиться с двух сторон, поэтому мощность будет распределяться по опорам поровну
  let changingVoltage = headVoltage;
  let gasStations = 0;
  let chargingStations = 0;
  let powerLoss = 0;
  let preTransformVoltage = headVoltage;
  while (
    preTransformVoltage /*условие остановки итераций */ >
      380 * TRANSFORMER.transformCoefficient &&
    changingPowerFlow.activePower >
      scheme.power
        .activePower /*changingPowerFlow.activePower > scheme.power.activePower*/
  ) {
    iteration++;

    const deltaPower = calcDeltaPower(
      scheme.line.r,
      scheme.line.x,
      changingVoltage,
      changingPowerFlow.activePower,
      changingPowerFlow.reactivePower
    );

    const deltaVoltage = calcDeltaVoltage(
      scheme.line.r,
      changingVoltage,
      changingPowerFlow.activePower,
      changingPowerFlow.reactivePower
    );

    changingVoltage -= deltaVoltage;

    const iteratedLossParams = iterativeCalculation(
      EPSILON,
      changingVoltage,
      TRANSFORMER,
      scheme.power,
      iteration
    );

    const deltaTransformerPower = iteratedLossParams.deltaTransformerPower;

    const deltaTransformerVoltage = iteratedLossParams.deltaTransformerVoltage;

    changingPowerFlow.activePower =
      changingPowerFlow.activePower -
      deltaPower.active -
      scheme.power.activePower -
      TRANSFORMER.activePowerLoss -
      deltaTransformerPower.active;

    powerLoss =
      powerLoss +
      deltaPower.active +
      TRANSFORMER.activePowerLoss +
      deltaTransformerPower.active;

    changingPowerFlow.reactivePower =
      changingPowerFlow.reactivePower -
      deltaPower.reactive -
      scheme.power.reactivePower -
      TRANSFORMER.reactivePowerLoss -
      deltaTransformerPower.reactive;

    preTransformVoltage = changingVoltage - deltaTransformerVoltage;

    if (iteration % scheme.gasStationRate === 0) {
      gasStations++;
      changingPowerFlow.activePower =
        changingPowerFlow.activePower - GAS_STATION.activePower;
      changingPowerFlow.reactivePower =
        changingPowerFlow.reactivePower - GAS_STATION.reactivePower;
    }

    if (iteration % scheme.gasStationRate === 0) {
      chargingStations++;
      changingPowerFlow.activePower =
        changingPowerFlow.activePower - CHARGE_STATION.activePower;
      changingPowerFlow.reactivePower =
        changingPowerFlow.reactivePower - CHARGE_STATION.reactivePower;
    }
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
  let preTransformVoltage = endVoltage;
  while (
    scheme.step * (iteration + 1) /*условие остановки итераций */ <=
    20000 /*changingPowerFlow.activePower > scheme.power.activePower*/
  ) {
    iteration++;
    if (iteration === 1) {
      const deltaTransformerPower = calcDeltaPower(
        TRANSFORMER.activeRes,
        TRANSFORMER.reactiveRes,
        preTransformVoltage,
        scheme.power.activePower,
        scheme.power.reactivePower
      );

      const deltaTransformerVoltage = calcDeltaVoltage(
        TRANSFORMER.activeRes,
        preTransformVoltage,
        scheme.power.activePower,
        scheme.power.reactivePower
      );

      changingVoltage = preTransformVoltage + deltaTransformerVoltage;

      const deltaPower = calcDeltaPower(
        scheme.line.r,
        scheme.line.x,
        changingVoltage,
        changingPowerFlow.activePower +
          deltaTransformerPower.active +
          TRANSFORMER.activePowerLoss,
        changingPowerFlow.reactivePower +
          deltaTransformerPower.reactive +
          TRANSFORMER.reactivePowerLoss
      );

      const deltaVoltage = calcDeltaVoltage(
        scheme.line.r,
        changingVoltage,
        changingPowerFlow.activePower +
          deltaTransformerPower.active +
          TRANSFORMER.activePowerLoss,
        changingPowerFlow.reactivePower +
          deltaTransformerPower.reactive +
          TRANSFORMER.reactivePowerLoss
      );

      changingVoltage += deltaVoltage;
      // console.log(changingVoltage);
      changingPowerFlow.activePower =
        changingPowerFlow.activePower +
        deltaPower.active +
        deltaTransformerPower.active +
        TRANSFORMER.activePowerLoss;

      powerLoss =
        powerLoss +
        deltaPower.active +
        deltaTransformerPower.active +
        TRANSFORMER.activePowerLoss;

      changingPowerFlow.reactivePower =
        changingPowerFlow.reactivePower +
        deltaPower.reactive +
        deltaTransformerPower.reactive +
        TRANSFORMER.reactivePowerLoss;
    } else {
      const iteratedLossParams = iterativeCalculation(
        EPSILON,
        changingVoltage,
        TRANSFORMER,
        scheme.power,
        iteration
      );

      const deltaTransformerPower = iteratedLossParams.deltaTransformerPower;

      const deltaTransformerVoltage =
        iteratedLossParams.deltaTransformerVoltage;
      //
      // console.log("in transformer", deltaTransformerVoltage);
      //
      preTransformVoltage = changingVoltage - deltaTransformerVoltage;

      const deltaPower = calcDeltaPower(
        scheme.line.r,
        scheme.line.x,
        changingVoltage,
        changingPowerFlow.activePower +
          deltaTransformerPower.active +
          TRANSFORMER.activePowerLoss +
          scheme.power.activePower,
        changingPowerFlow.reactivePower +
          deltaTransformerPower.reactive +
          TRANSFORMER.reactivePowerLoss +
          scheme.power.reactivePower
      );

      const deltaVoltage = calcDeltaVoltage(
        scheme.line.r,
        changingVoltage,
        changingPowerFlow.activePower +
          deltaTransformerPower.active +
          TRANSFORMER.activePowerLoss +
          scheme.power.activePower,
        changingPowerFlow.reactivePower +
          deltaTransformerPower.reactive +
          TRANSFORMER.reactivePowerLoss +
          scheme.power.reactivePower
      );
      //
      // console.log("in line ", deltaVoltage);
      //
      changingVoltage += deltaVoltage;
      changingPowerFlow.activePower =
        changingPowerFlow.activePower +
        deltaPower.active +
        deltaTransformerPower.active +
        TRANSFORMER.activePowerLoss +
        scheme.power.activePower;

      powerLoss =
        powerLoss +
        deltaPower.active +
        deltaTransformerPower.active +
        TRANSFORMER.activePowerLoss;

      changingPowerFlow.reactivePower =
        changingPowerFlow.reactivePower +
        deltaPower.reactive +
        deltaTransformerPower.reactive +
        TRANSFORMER.reactivePowerLoss +
        scheme.power.reactivePower;
    }
    // if (iteration % scheme.gasStationRate === 0) {
    //   gasStations++;
    //   changingPowerFlow.activePower =
    //     changingPowerFlow.activePower + GAS_STATION.activePower;
    //   changingPowerFlow.reactivePower =
    //     changingPowerFlow.reactivePower + GAS_STATION.reactivePower;
    // }
    // if (iteration % scheme.gasStationRate === 0) {
    //   chargingStations++;
    //   changingPowerFlow.activePower =
    //     changingPowerFlow.activePower + CHARGE_STATION.activePower;
    //   changingPowerFlow.reactivePower =
    //     changingPowerFlow.reactivePower + CHARGE_STATION.reactivePower;
    // }
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
  SCHEME_PARAMS[0],
  END_VOLTAGE
);

console.log(calculatedFromEnd);
