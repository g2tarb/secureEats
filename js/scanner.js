/**
 * SecurColis - Scanner QR Code via caméra
 * Utilise BarcodeDetector API avec fallback
 */
const Scanner = (() => {
  let stream = null;
  let video = null;
  let scanning = false;
  let animFrame = null;
  let detector = null;

  function isSupported() {
    return 'BarcodeDetector' in window;
  }

  async function init() {
    if (isSupported()) {
      detector = new BarcodeDetector({ formats: ['qr_code'] });
    }
  }

  async function start(videoElement, onDetected) {
    if (scanning) return;

    video = videoElement;
    scanning = true;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      video.srcObject = stream;
      video.setAttribute('playsinline', true);
      await video.play();

      if (!detector) {
        await init();
      }

      if (!detector) {
        throw new Error('BarcodeDetector non supporté par ce navigateur');
      }

      const scan = async () => {
        if (!scanning) return;

        try {
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            const barcodes = await detector.detect(video);
            for (const barcode of barcodes) {
              if (barcode.rawValue) {
                stop();
                onDetected(barcode.rawValue);
                return;
              }
            }
          }
        } catch (e) {
          // Ignore detection errors, keep scanning
        }

        animFrame = requestAnimationFrame(scan);
      };

      animFrame = requestAnimationFrame(scan);
    } catch (err) {
      stop();
      throw err;
    }
  }

  function stop() {
    scanning = false;
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    if (video) {
      video.srcObject = null;
    }
  }

  function isScanning() {
    return scanning;
  }

  return { start, stop, isScanning, isSupported };
})();
