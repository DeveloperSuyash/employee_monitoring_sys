const { spawn } = require('node:child_process');
const path = require('node:path');

let inputBuffer = Buffer.alloc(0);
let overlayProcess = null;

function sendMessage(message) {
  const payload = Buffer.from(JSON.stringify(message), 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32LE(payload.length, 0);
  process.stdout.write(Buffer.concat([header, payload]));
}

function stopOverlay() {
  if (!overlayProcess) {
    return;
  }

  try {
    overlayProcess.kill();
  } catch (_error) {
    // Process may already be closed.
  }

  overlayProcess = null;
}

function startOverlay(reason) {
  if (overlayProcess) {
    return;
  }

  const scriptPath = path.join(__dirname, 'idle-overlay.ps1');
  overlayProcess = spawn(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-Reason', reason || 'browser-idle'],
    {
      cwd: __dirname,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );

  let lineBuffer = '';
  overlayProcess.stdout.on('data', (chunk) => {
    lineBuffer += chunk.toString('utf8');
    const lines = lineBuffer.split(/\r?\n/);
    lineBuffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      try {
        const message = JSON.parse(trimmed);
        sendMessage(message);
      } catch (_error) {
        sendMessage({ action: 'nativeOverlayLog', message: trimmed });
      }
    }
  });

  overlayProcess.stderr.on('data', (chunk) => {
    sendMessage({ action: 'nativeOverlayError', message: chunk.toString('utf8') });
  });

  overlayProcess.on('exit', () => {
    overlayProcess = null;
  });
}

function handleMessage(message) {
  if (message?.action === 'showIdleOverlay') {
    startOverlay(message.reason);
    sendMessage({ action: 'nativeOverlayShown' });
    return;
  }

  if (message?.action === 'closeIdleOverlay') {
    stopOverlay();
    sendMessage({ action: 'nativeOverlayClosed' });
  }
}

function readMessages() {
  while (inputBuffer.length >= 4) {
    const messageLength = inputBuffer.readUInt32LE(0);
    if (inputBuffer.length < messageLength + 4) {
      return;
    }

    const rawMessage = inputBuffer.subarray(4, 4 + messageLength).toString('utf8');
    inputBuffer = inputBuffer.subarray(4 + messageLength);

    try {
      handleMessage(JSON.parse(rawMessage));
    } catch (error) {
      sendMessage({ action: 'nativeOverlayError', message: error.message });
    }
  }
}

process.stdin.on('data', (chunk) => {
  inputBuffer = Buffer.concat([inputBuffer, chunk]);
  readMessages();
});

process.stdin.on('end', () => {
  stopOverlay();
});
