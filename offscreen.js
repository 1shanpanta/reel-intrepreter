chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.id !== chrome.runtime.id) return;

  if (message.action === "startRecording") {
    recordTabAudio(message.streamId, message.duration);
  }
});

async function recordTabAudio(streamId, duration) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      },
    });

    const recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });

    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());

      const blob = new Blob(chunks, { type: "audio/webm" });
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64 = reader.result.split(",")[1];
        chrome.runtime.sendMessage({ action: "audioData", data: base64 });
      };

      reader.readAsDataURL(blob);
    };

    recorder.start();

    setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
      }
    }, duration);
  } catch (err) {
    console.error("Offscreen recording error:", err);
    chrome.runtime.sendMessage({ action: "audioData", data: null });
  }
}
