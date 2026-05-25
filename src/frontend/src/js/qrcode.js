import QRCodeGenerator from 'qrcode-generator';

export function renderQR(container, value) {
  container.innerHTML = '';

  try {
    const typeNumber = QRCodeGenerator.getTypeNumber(value, QRCodeGenerator.QRErrorCorrectLevel.H);
    const qrCode = QRCodeGenerator.createQRCode(value, typeNumber, QRCodeGenerator.QRErrorCorrectLevel.H);
    const moduleCount = qrCode.getModuleCount();
    const size = 280;
    const cellSize = size / moduleCount;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.style.maxWidth = '280px';

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', 'white');
    svg.appendChild(rect);

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qrCode.isDark(row, col)) {
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
