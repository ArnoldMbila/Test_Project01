using System.Collections.Generic;
using UnityEngine;

namespace BibleArcade.Core
{
    /// <summary>
    /// Central SFX/music player. Clips are optional — if none are assigned, short
    /// procedural feedback tones are synthesized at runtime so the project gives
    /// audio feedback even before any audio assets exist.
    /// </summary>
    public class AudioManager : MonoBehaviour
    {
        [Header("Optional Clips (synth fallback if empty)")]
        [SerializeField] private AudioClip correctClip;
        [SerializeField] private AudioClip wrongClip;
        [SerializeField] private AudioClip coinClip;
        [SerializeField] private AudioClip levelUpClip;
        [SerializeField] private AudioClip clickClip;
        [SerializeField] private AudioClip musicLoop;

        [Range(0f, 1f)] public float sfxVolume = 0.8f;
        [Range(0f, 1f)] public float musicVolume = 0.4f;

        private AudioSource _sfx;
        private AudioSource _music;
        private readonly Dictionary<string, AudioClip> _synthCache = new Dictionary<string, AudioClip>();

        private void Awake()
        {
            _sfx = gameObject.AddComponent<AudioSource>();
            _music = gameObject.AddComponent<AudioSource>();
            _music.loop = true;
            if (musicLoop != null)
            {
                _music.clip = musicLoop;
                _music.volume = musicVolume;
                _music.Play();
            }
        }

        public void PlayCorrect() => Play(correctClip, "correct", 660f, 880f, 0.18f);
        public void PlayWrong() => Play(wrongClip, "wrong", 220f, 180f, 0.25f);
        public void PlayCoin() => Play(coinClip, "coin", 990f, 1320f, 0.10f);
        public void PlayLevelUp() => Play(levelUpClip, "levelup", 523f, 1046f, 0.45f);
        public void PlayClick() => Play(clickClip, "click", 440f, 440f, 0.05f);

        private void Play(AudioClip clip, string synthKey, float fromHz, float toHz, float seconds)
        {
            _sfx.PlayOneShot(clip != null ? clip : GetSynth(synthKey, fromHz, toHz, seconds), sfxVolume);
        }

        private AudioClip GetSynth(string key, float fromHz, float toHz, float seconds)
        {
            if (_synthCache.TryGetValue(key, out var cached)) return cached;

            int rate = AudioSettings.outputSampleRate;
            int samples = Mathf.CeilToInt(rate * seconds);
            var data = new float[samples];
            float phase = 0f;
            for (int i = 0; i < samples; i++)
            {
                float t = (float)i / samples;
                float hz = Mathf.Lerp(fromHz, toHz, t);
                phase += hz / rate;
                float envelope = Mathf.Sin(t * Mathf.PI); // fade in/out, no clicks
                data[i] = Mathf.Sin(phase * 2f * Mathf.PI) * envelope * 0.5f;
            }

            var clip = AudioClip.Create(key, samples, 1, rate, false);
            clip.SetData(data, 0);
            _synthCache[key] = clip;
            return clip;
        }
    }
}
