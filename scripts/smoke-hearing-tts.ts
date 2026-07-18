import { synthesizeHearingSpeech, neuralTtsReady } from '../src/lib/hearing/gemini-tts.ts';

async function main() {
  console.log('ready', neuralTtsReady());
  const r = await synthesizeHearingSpeech(
    'Welcome. This is Building Culture Hearing Mode. Soften your eyes — I am right here with you. Take one easy breath.',
    'guide'
  );
  console.log({
    voice: r.voice,
    model: r.model,
    cached: r.cached,
    bytes: r.wav.length,
    riff: r.wav.toString('ascii', 0, 4),
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
