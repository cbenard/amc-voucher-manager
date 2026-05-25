import QRCode from 'qrcode-generator';

export function renderQR(container, value) {
  container.innerHTML = '';

  try {
    const qr = QRCode(0, 'H');
    qr.addData(value);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const size = 280;
    const cellSize = size / moduleCount;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.style.maxWidth = '280px';

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', 'white');
    svg.appendChild(bg);

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          const cell = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          cell.setAttribute('x', String(col * cellSize));
          cell.setAttribute('y', String(row * cellSize));
          cell.setAttribute('width', String(cellSize));
          cell.setAttribute('height', String(cellSize));
          cell.setAttribute('fill', '#1a1a2e');
          svg.appendChild(cell);
        }
      }
    }

    container.appendChild(svg);

    const label = document.createElement('div');
    label.className = 'numbers';
    label.textContent = value;
    container.appendChild(label);
  } catch {
    container.textContent = value;
  }
}
