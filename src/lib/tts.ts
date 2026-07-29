export function speak(text: string, onEnd?: () => void) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB";
    u.rate = 0.95;
    if (onEnd) u.onend = onEnd;
    speechSynthesis.speak(u);
  } catch {
    onEnd?.();
  }
}

export function stopSpeaking() {
  try {
    speechSynthesis.cancel();
  } catch {
    /* Web Speech API unavailable */
  }
}
