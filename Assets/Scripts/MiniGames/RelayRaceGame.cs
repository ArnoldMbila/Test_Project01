using BibleArcade.Data;
using UnityEngine;

namespace BibleArcade.MiniGames
{
    /// <summary>
    /// "Lauf der Boten" — race-inspired quiz. The player's messenger orb races a
    /// rival down parallel lanes. The rival advances at a steady pace; the player
    /// only sprints when answering correctly (big boost, bigger when fast).
    /// Cross the finish line before the rival to win the race overall.
    /// </summary>
    public class RelayRaceGame : MiniGameBase
    {
        [SerializeField] private float trackLength = 60f;
        [SerializeField] private float rivalStepPerQuestion = 8f;
        [SerializeField] private float playerStepCorrect = 11f;

        private GameObject _root, _player, _rival;
        private GameObject[] _answerBlocks;
        private float _playerZ, _rivalZ;
        private bool _active;
        private Camera _cam;

        protected override QuestionType[] SupportedTypes =>
            new[] { QuestionType.MultipleChoice };

        protected override void Start()
        {
            _cam = SceneKit.EnsureCamera(new Vector3(0, 9f, -12f), new Vector3(30f, 0, 0));
            SceneKit.EnsureLight();
            base.Start();
        }

        protected override void PresentQuestion(Question q)
        {
            if (_root == null) BuildTrack();
            Hud.SetPrompt(q.prompt);

            int n = q.options.Length;
            _answerBlocks = new GameObject[n];
            float width = 16f / n;
            for (int i = 0; i < n; i++)
            {
                _answerBlocks[i] = SceneKit.MakeAnswerBlock(_root.transform, q.options[i],
                    new Vector3(-8f + width * (i + 0.5f), 1f, _playerZ - 6f),
                    new Vector3(width * 0.85f, 1.8f, 0.5f),
                    SceneKit.OptionColors[i % SceneKit.OptionColors.Length]);
            }
            _active = true;
        }

        private void BuildTrack()
        {
            _root = new GameObject("RaceTrack");
            SceneKit.MakeGround(_root.transform, new Vector3(-4f, -0.5f, trackLength / 2f),
                new Vector3(7f, 1f, trackLength + 20f), new Color(0.20f, 0.30f, 0.20f));
            SceneKit.MakeGround(_root.transform, new Vector3(4f, -0.5f, trackLength / 2f),
                new Vector3(7f, 1f, trackLength + 20f), new Color(0.30f, 0.22f, 0.18f));

            var finish = SceneKit.MakeGround(_root.transform, new Vector3(0, 0.05f, trackLength),
                new Vector3(16f, 0.1f, 1.5f), Color.white);
            SceneKit.MakeLabel(finish.transform, "ZIEL", new Vector3(0, 25f, 0), 2.5f);

            _player = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            _player.name = "PlayerRunner";
            _player.transform.SetParent(_root.transform);
            SceneKit.Tint(_player, new Color(0.95f, 0.9f, 0.3f));

            _rival = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            _rival.name = "Rival";
            _rival.transform.SetParent(_root.transform);
            SceneKit.Tint(_rival, new Color(0.7f, 0.25f, 0.25f));

            _playerZ = 0f;
            _rivalZ = 0f;
            UpdateRunnerPositions();
        }

        private void UpdateRunnerPositions()
        {
            _player.transform.position = new Vector3(-4f, 0.6f, _playerZ);
            _rival.transform.position = new Vector3(4f, 0.6f, _rivalZ);
            _cam.transform.position = new Vector3(0, 9f, _playerZ - 12f);
        }

        private void Update()
        {
            if (!_active || _answerBlocks == null) return;
            var hit = SceneKit.PickOnClick(_cam);
            if (hit == null) return;

            for (int i = 0; i < _answerBlocks.Length; i++)
            {
                if (_answerBlocks[i] != null && hit.gameObject == _answerBlocks[i])
                {
                    _active = false;
                    bool correct = i == CurrentQuestion.correctIndex;
                    SceneKit.Tint(_answerBlocks[i], correct ? Color.green : Color.red);
                    SceneKit.Tint(_answerBlocks[CurrentQuestion.correctIndex], Color.green);

                    if (correct) _playerZ += playerStepCorrect;
                    _rivalZ += rivalStepPerQuestion;
                    UpdateRunnerPositions();
                    SubmitAnswer(correct);
                    return;
                }
            }
        }

        protected override void OnSessionFinished()
        {
            bool won = _playerZ >= _rivalZ;
            Hud.SetPrompt(won ? "Du hast das Rennen gewonnen! +20 Münzen" : "Knapp! Der Rivale war schneller.");
            if (won) Services.Progression.AddCoins(20);
            base.OnSessionFinished();
            if (_root != null) { Destroy(_root); _root = null; }
        }

        protected override void CleanupQuestion()
        {
            _active = false;
            if (_answerBlocks == null) return;
            foreach (var b in _answerBlocks) if (b != null) Destroy(b);
            _answerBlocks = null;
        }
    }
}
