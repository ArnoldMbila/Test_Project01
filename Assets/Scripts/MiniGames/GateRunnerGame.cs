using BibleArcade.Data;
using UnityEngine;

namespace BibleArcade.MiniGames
{
    /// <summary>
    /// "Wortlauf" — endless-runner-inspired quiz. The player orb auto-runs down a
    /// lane; ahead stand up to 4 answer gates. Steer left/right (A/D or arrows)
    /// and run through the gate you believe is correct. Original mechanic built
    /// for this project; no third-party game content.
    /// </summary>
    public class GateRunnerGame : MiniGameBase
    {
        [SerializeField] private float runSpeed = 8f;
        [SerializeField] private float steerSpeed = 9f;
        [SerializeField] private float gateDistance = 42f;

        private GameObject _player;
        private GameObject _track;
        private GameObject[] _gates;
        private int[] _gateOptionIndex;
        private bool _running;
        private Camera _cam;

        protected override QuestionType[] SupportedTypes =>
            new[] { QuestionType.MultipleChoice };

        protected override void Start()
        {
            _cam = SceneKit.EnsureCamera(new Vector3(0, 6f, -10f), new Vector3(22f, 0, 0));
            SceneKit.EnsureLight();
            base.Start();
        }

        protected override void PresentQuestion(Question q)
        {
            Hud.SetPrompt(q.prompt);

            _track = new GameObject("Track");
            SceneKit.MakeGround(_track.transform, new Vector3(0, -0.5f, gateDistance / 2f),
                new Vector3(14f, 1f, gateDistance + 30f), new Color(0.16f, 0.20f, 0.30f));

            _player = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            _player.name = "Runner";
            _player.transform.SetParent(_track.transform);
            _player.transform.position = new Vector3(0, 0.6f, 0);
            SceneKit.Tint(_player, new Color(0.95f, 0.9f, 0.3f));

            int n = q.options.Length;
            _gates = new GameObject[n];
            _gateOptionIndex = new int[n];
            float laneWidth = 14f / n;
            for (int i = 0; i < n; i++)
            {
                float x = -7f + laneWidth * (i + 0.5f);
                _gates[i] = SceneKit.MakeAnswerBlock(_track.transform, q.options[i],
                    new Vector3(x, 1.6f, gateDistance), new Vector3(laneWidth * 0.85f, 3.2f, 0.6f),
                    SceneKit.OptionColors[i % SceneKit.OptionColors.Length]);
                _gateOptionIndex[i] = i;
            }
            _running = true;
        }

        private void Update()
        {
            if (!_running || _player == null) return;

            float steer = Input.GetAxisRaw("Horizontal");
            var pos = _player.transform.position;
            pos.x = Mathf.Clamp(pos.x + steer * steerSpeed * Time.deltaTime, -6.5f, 6.5f);
            pos.z += runSpeed * Time.deltaTime;
            _player.transform.position = pos;

            // camera follows runner
            _cam.transform.position = new Vector3(pos.x * 0.6f, 6f, pos.z - 10f);

            if (pos.z >= gateDistance - 0.5f)
            {
                _running = false;
                int hitGate = NearestGate(pos.x);
                bool correct = _gateOptionIndex[hitGate] == CurrentQuestion.correctIndex;
                SceneKit.Tint(_gates[hitGate], correct ? Color.green : Color.red);
                SceneKit.Tint(_gates[CurrentQuestion.correctIndex], Color.green);
                SubmitAnswer(correct);
            }
        }

        private int NearestGate(float x)
        {
            int best = 0;
            float bestDist = float.MaxValue;
            for (int i = 0; i < _gates.Length; i++)
            {
                float d = Mathf.Abs(_gates[i].transform.position.x - x);
                if (d < bestDist) { bestDist = d; best = i; }
            }
            return best;
        }

        protected override void CleanupQuestion()
        {
            _running = false;
            if (_track != null) Destroy(_track);
        }
    }
}
