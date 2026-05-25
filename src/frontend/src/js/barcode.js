import JsBarcode from 'jsbarcode';

export function renderBarcode(container, value) {
  container.innerHTML = '';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '80');
  svg.style.maxWidth = '300px';
  container.appendChild(svg);

  try {
    JsBarcode(svg, value, {
      format: 'CODE128',
      width: 2,
      height: 70,
      displayValue: true,
      fontSize: 16,
      margin: 10,
    });
  } catch {
    const fallback = document.createElement('div');
    fallback.className = 'numbers';
    fallback.textContent = value;
    container.appendChild(fallback);
  }
}
