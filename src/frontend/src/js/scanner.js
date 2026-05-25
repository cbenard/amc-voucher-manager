export function openScanner(onResult) {
  const existing = document.getElementById('scanner-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'scanner-overlay';

  const readerContainer = document.createElement('div');
  readerContainer.id = 'scanner-reader';
  overlay.appendChild(readerContainer);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-scanner';
  closeBtn.innerHTML = '&times;';
  overlay.appendChild(closeBtn);

  const statusEl = document.createElement('p');
  statusEl.style.cssText = 'color:white;margin-top:12px;font-size:0.9em;';
  statusEl.textContent = 'Point camera at barcode';
  overlay.appendChild(statusEl);

  document.body.appendChild(overlay);

  let detector = null;
  let stream = null;
  let animationId = null;
  let htmlScanner = null;
  let aborted = false;

  const useNative = 'BarcodeDetector' in window;

  closeBtn.onclick = () => {
    aborted = true;
    teardown();
  };

  async function setup() {
    try {
      if (aborted) return;
      if (useNative) {
        const video = document.createElement('video');
        video.setAttribute('autoplay', '');
        video.setAttribute('playsinline', '');
        readerContainer.appendChild(video);
        if (aborted) return;
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (aborted) { releaseStream(); return; }
        video.srcObject = stream;
        await video.play();
        detector = new BarcodeDetector({ formats: ['code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code'] });
        nativeLoop(video);
      } else {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (aborted) return;
        htmlScanner = new Html5Qrcode('scanner-reader');
        await htmlScanner.start(
          { facingMode: 'environment' },
          { fps: 10 },
          (decodedText) => {
            teardown();
            onResult(decodedText);
          },
          () => {}
        );
      }
    } catch (err) {
      statusEl.textContent = 'Camera error: ' + (err.message || err);
      releaseAll();
    }
  }

  async function nativeLoop(video) {
    if (aborted || !detector || !video.videoWidth) {
      animationId = requestAnimationFrame(() => nativeLoop(video));
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
    if (!aborted) {
      animationId = requestAnimationFrame(() => nativeLoop(video));
    }
  }

  function releaseStream() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
  }

  function releaseScanner() {
    if (htmlScanner) {
      try {
        htmlScanner.stop().catch(() => {});
      } catch {}
      htmlScanner = null;
    }
  }

  function releaseAll() {
    releaseStream();
    releaseScanner();
  }

  function teardown() {
    aborted = true;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    releaseAll();
    detector = null;
    overlay.remove();
  }

  setup();
}
