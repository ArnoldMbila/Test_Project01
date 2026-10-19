// Nimmt deine Stimme zusammen mit der Musik auf (zum Anhören & Herunterladen).
import { audioCtx, mic, latency } from './engine.js';

export class PerformanceRecorder {
  constructor(musicNode) {
    const c = audioCtx();
    this.dest = c.createMediaStreamDestination();
    this.voice = c.createGain();
    this.voice.gain.value = 1.4;
    mic.source && mic.source.connect(this.voice);
    this.voice.connect(this.dest);
    // Musik um die Latenz verzögern, damit Stimme und Musik in der Aufnahme zusammenpassen
    this.delay = c.createDelay(1);
    this.delay.delayTime.value = latency();
    this.music = c.createGain();
    this.music.gain.value = 0.55;
    if (musicNode) musicNode.connect(this.delay);
    this.delay.connect(this.music).connect(this.dest);
    this.musicNode = musicNode;
    this.chunks = [];
    this.rec = null;
  }

  static supported() { return typeof MediaRecorder !== 'undefined'; }

  start() {
    if (!PerformanceRecorder.supported()) return false;
    const types = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'];
    const mimeType = types.find((t) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
    this.rec = new MediaRecorder(this.dest.stream, mimeType ? { mimeType } : undefined);
    this.rec.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.rec.start(1000);
    return true;
  }

  pause() { if (this.rec && this.rec.state === 'recording') this.rec.pause(); }
  resume() { if (this.rec && this.rec.state === 'paused') this.rec.resume(); }

  stop() {
    return new Promise((res) => {
      const finish = () => {
        this.cleanup();
        res(this.chunks.length ? new Blob(this.chunks, { type: this.chunks[0].type || 'audio/webm' }) : null);
      };
      if (!this.rec || this.rec.state === 'inactive') return finish();
      this.rec.onstop = finish;
      this.rec.stop();
    });
  }

  cleanup() {
    try { mic.source && mic.source.disconnect(this.voice); } catch (_) {}
    try { this.musicNode && this.musicNode.disconnect(this.delay); } catch (_) {}
  }
}
