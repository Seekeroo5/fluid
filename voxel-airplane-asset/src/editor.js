const aircraftLabels = {
  sciFi: 'Sci-Fi Aircraft',
  mythic: 'Mythical Aircraft',
  cyberpunk: 'Cyberpunk Aircraft',
  steampunk: 'Steampunk Aircraft',
  solarpunk: 'Solarpunk Aircraft',
};

function colorToHex(color) {
  return `#${color.toString(16).padStart(6, '0')}`;
}

function formatLabel(value) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}

export function createEditor({
  mount,
  state,
  getActiveAircraft,
  setAircraftType,
  setIdleRotation,
  resetActiveAircraft,
}) {
  mount.className = 'editor';

  function render() {
    const aircraft = getActiveAircraft();
    mount.innerHTML = '';

    const title = document.createElement('h1');
    title.textContent = 'Voxel Aircraft';
    mount.append(title);

    const modelSection = document.createElement('div');
    modelSection.className = 'editor-section';
    mount.append(modelSection);

    const selectorRow = createRow('Aircraft');
    const selector = document.createElement('select');
    for (const [value, label] of Object.entries(aircraftLabels)) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      option.selected = state.aircraftType === value;
      selector.append(option);
    }
    selector.addEventListener('change', () => setAircraftType(selector.value));
    selectorRow.append(selector);
    modelSection.append(selectorRow);

    const rotateRow = createRow('Idle rotation');
    const rotateInput = document.createElement('input');
    rotateInput.type = 'checkbox';
    rotateInput.checked = state.idleRotation;
    rotateInput.addEventListener('change', () => setIdleRotation(rotateInput.checked));
    rotateRow.append(rotateInput);
    modelSection.append(rotateRow);

    const scaleRow = createRow('Scale');
    const scaleInput = document.createElement('input');
    scaleInput.type = 'range';
    scaleInput.min = '0.6';
    scaleInput.max = '1.8';
    scaleInput.step = '0.05';
    scaleInput.value = String(state.scale);
    scaleInput.addEventListener('input', () => {
      state.scale = Number(scaleInput.value);
      aircraft.setScale(state.scale);
    });
    scaleRow.append(scaleInput);
    modelSection.append(scaleRow);

    const speedRow = createRow('Animation speed');
    const speedInput = document.createElement('input');
    speedInput.type = 'range';
    speedInput.min = '0';
    speedInput.max = '2.5';
    speedInput.step = '0.05';
    speedInput.value = String(state.animationSpeed);
    speedInput.addEventListener('input', () => {
      state.animationSpeed = Number(speedInput.value);
      aircraft.setAnimationSpeed(state.animationSpeed);
    });
    speedRow.append(speedInput);
    modelSection.append(speedRow);

    const colorsSection = document.createElement('div');
    colorsSection.className = 'editor-section';
    mount.append(colorsSection);

    for (const colorPart of aircraft.colorParts) {
      const row = createRow(formatLabel(colorPart));
      const input = document.createElement('input');
      input.type = 'color';
      input.value = colorToHex(aircraft.palette[colorPart]);
      input.addEventListener('input', () => aircraft.setColor(colorPart, input.value));
      row.append(input);
      colorsSection.append(row);
    }

    const partsSection = document.createElement('div');
    partsSection.className = 'editor-section';
    mount.append(partsSection);

    for (const partName of aircraft.toggleParts) {
      const row = createRow(formatLabel(partName));
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = aircraft.parts[partName]?.visible ?? true;
      input.addEventListener('change', () => aircraft.setPartVisible(partName, input.checked));
      row.append(input);
      partsSection.append(row);
    }

    const resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.textContent = 'Reset asset';
    resetButton.addEventListener('click', resetActiveAircraft);
    mount.append(resetButton);
  }

  function createRow(labelText) {
    const row = document.createElement('label');
    row.className = 'editor-row';
    const span = document.createElement('span');
    span.textContent = labelText;
    row.append(span);
    return row;
  }

  render();

  return { render };
}
