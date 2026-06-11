using BibleArcade.Data;
using UnityEngine;

namespace BibleArcade.MiniGames
{
    /// <summary>
    /// "Takt der Wahrheit" — rhythm-inspired quiz. A pulse ring beats steadily
    /// around the answer pedestals; answering ON the beat (ring near its smallest)
    /// earns a tempo bonus heart-up of the combo. The countdown bar keeps gentle
    /// time pressure: 4 bars per question, then it auto-submits a miss. The beat
    /// gives ADHD players an external pacing anchor.
    /// </summary>
    public class RhythmQuizGame : MiniGameBase
    {
        [SerializeField] private float beatsPerMinute = 100f;
        [SerializeField] private int barsPerQuestion = 4;

        private GameObject _root, _pulseRing;
        private GameObject[] _pedestals;
        private TextMesh _timeLabel;
        private float _questionTimer, _timeLimit, _beatLength;
        private bool _active;
        private Camera _cam;

        protected override QuestionType[] SupportedTypes =>
            new[] { QuestionType.MultipleChoice };

        protected override void Start()
        {
            _cam = SceneKit.EnsureCamera(new Vector3(0, 8f, -10f), new Vector3(35f, 0, 0));
            SceneKit.EnsureLight();
            _beatLength = 60f / beatsPerMinute;
            _timeLimit = _beatLength * 4 * barsPerQuestion;
            base.Start();
        }

        protected override void PresentQuestion(Question q)
        {
            Hud.SetPrompt(q.prompt);
            _root = new GameObject("RhythmStage");
            SceneKit.MakeGround(_root.transform, Vector3.zero, new Vector3(18f, 0.4f, 14f),
                new Color(0.14f, 0.10f, 0.25f));

            _pulseRing = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            _pulseRing.name = "PulseRing";
            _pulseRing.transform.SetParent(_root.transform);
            _pulseRing.transform.position = new Vector3(0, 0.3f, 1.5f);
            Destroy(_pulseRing.GetComponent<Collider>());
            SceneKit.Tint(_pulseRing, new Color(0.9f, 0.4f, 0.8f, 0.6f));

            int n = q.options.Length;
            _pedestals = new GameObject[n];
            for (int i = 0; i < n; i++)
            {
                float angle = Mathf.PI * (0.2f + 0.6f * i / Mathf.Max(n - 1, 1));
                var pos = new Vector3(Mathf.Cos(angle) * 7f, 1f, 1.5f + Mathf.Sin(angle) * 4.5f);
                _pedestals[i] = SceneKit.MakeAnswerBlock(_root.transform, q.options[i],
                    pos, new Vector3(3.2f, 2f, 0.6f),
                    SceneKit.OptionColors[i % SceneKit.OptionColors.Length]);
            }

            var anchor = new GameObject("TimeAnchor");
            anchor.transform.SetParent(_root.transform);
            anchor.transform.position = new Vector3(0, 5.5f, 4f);
            _timeLabel = SceneKit.MakeLabel(anchor.transform, "", Vector3.zero, 0.7f);

            _questionTimer = 0f;
            _active = true;
        }

        private void Update()
        {
            if (!_active || _pulseRing == null) return;

            _questionTimer += Time.deltaTime;

            // ring pulses once per beat
            float beatPhase = (_questionTimer % _beatLength) / _beatLength;
            float scale = Mathf.Lerp(6f, 1.2f, beatPhase);
            _pulseRing.transform.localScale = new Vector3(scale, 0.1f, scale);

            float remaining = _timeLimit - _questionTimer;
            _timeLabel.text = $"♪ {Mathf.CeilToInt(remaining)}s";
            if (remaining <= 0f)
            {
                _active = false;
                SceneKit.Tint(_pedestals[CurrentQuestion.correctIndex], Color.green);
                SubmitAnswer(false); // ran out of time, show explanation
                return;
            }

            var hit = SceneKit.PickOnClick(_cam);
            if (hit == null) return;

            for (int i = 0; i < _pedestals.Length; i++)
            {
                if (_pedestals[i] != null && hit.gameObject == _pedestals[i])
                {
                    _active = false;
                    bool correct = i == CurrentQuestion.correctIndex;
                    bool onBeat = beatPhase > 0.75f; // clicked while ring is tight
                    SceneKit.Tint(_pedestals[i], correct ? Color.green : Color.red);
                    SceneKit.Tint(_pedestals[CurrentQuestion.correctIndex], Color.green);
                    if (correct && onBeat) Services.Progression.AddXp(5); // tempo bonus
                    SubmitAnswer(correct);
                    return;
                }
            }
        }

        protected override void CleanupQuestion()
        {
            _active = false;
            if (_root != null) Destroy(_root);
        }
    }
}
