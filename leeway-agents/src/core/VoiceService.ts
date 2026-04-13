export const VoiceService = {
  speak: async ({ text }: { text: string }) => {
    console.log('VoiceService speaking:', text);
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }
};
