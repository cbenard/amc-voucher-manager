export function openScanner(onResult) {
  const existing = document.getElementById('scanner-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'scanner-overlay';

  const video = document.createElement('video');
  video.setAttribute('autoplay', '');
  video.setAttribute('playsinline', '');
  overlay.appendChild(video);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-scanner';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = () => teardown();
  overlay.appendChild(closeBtn);

  const statusEl = document.createElement('p');
  statusEl.style.cssText = 'color:white;margin-top:12px;font-size:0.9em;';
  statusEl.textContent = 'Point camera at barcode';
  overlay.appendChild(statusEl);

  document.body.appendChild(overlay);

  let stream = null;
  let animationId = null;
  let detector = null;

  const useNativeDetector = 'BarcodeDetector' in window;

  async function setup() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      video.srcObject = stream;
      await video.play();

      if (useNativeDetector) {
        detector = new BarcodeDetector({ formats: ['code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code'] });
        scanLoop();
      } else {
        try {
          const { default: Quagga } = await import('@ericblade/quagga2');
          Quagga.init(
            {
              inputStream: {
                type: 'LiveStream',
                target: overlay,
                constraints: { facingMode: 'environment' },
              },
              decoder: { readers: ['code_128_reader', 'ean_reader', 'upc_reader', 'qr_reader'] },
              locate: true,
            },
            (err) => {
              if (err) {
                statusEl.textContent = 'Scanner init failed: ' + err;
                return;
              }
              Quagga.start();
              Quagga.onDetected((data) => {
                const code = data.codeResult.code;
                if (code) {
                  Quagga.stop();
                  teardown();
                  onResult(code);
                }
              });
            }
          );
        } catch {
          statusEl.textContent = 'No barcode scanner available on this device';
        }
      }
    } catch (err) {
      statusEl.textContent = 'Camera access denied: ' + err.message;
    }
  }

  async function scanLoop() {
    if (!detector || !video.videoWidth) {
      animationId = requestAnimationFrame(scanLoop);
      return;
    }
    try {
      const codes = await detector.detect(video);
      for (const code of codes) {
        if (code.rawValue) {
          teardown();
          onResult(code.rawValue);
          return;
        }
      }
    } catch {}
    animationId = requestAnimationFrame(scanLoop);
  }

  function teardown() {
    if (animationId) cancelAnimationFrame(animationId);
    if (stream) stream.getTracks().forEach((t) => t.stop());
    try {
      const Quagga = window.Quagga;
      if (Quagga) Quagga.stop();
    } catch {}
    overlay.remove();
  }

  setup();
}
