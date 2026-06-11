using BibleArcade.Data;
using UnityEngine;

namespace BibleArcade.MiniGames
{
    /// <summary>
    /// "Wächter des Wissens" — boss-battle-inspired quiz. A guardian golem looms
    /// at the arena's far end. Each correct answer hurls a light bolt that chips
    /// its armor; each mistake lets it stomp (player loses a heart, sees the
    /// explanation). Defeat it before losing 3 hearts. Original design.
    /// </summary>
    public class BossBattleGame : MiniGameBase
    {
        [SerializeField] private int playerHearts = 3;

        private GameObject _arena, _boss;
        private GameObject[] _answerBlocks;
        private TextMesh _bossHpLabel, _heartsLabel;
        private int _bossHp, _bossMaxHp, _hearts;
        private bool _active;
        private Camera _cam;

        protected override QuestionType[] SupportedTypes =>
            new[] { QuestionType.MultipleChoice };

        protected override void Start()
        {
            _cam = SceneKit.EnsureCamera(new Vector3(0, 3.5f, -12f), new Vector3(10f, 0, 0));
            SceneKit.EnsureLight();
            base.Start();
        }

        protected override void PresentQuestion(Question q)
        {
            if (_arena == null) BuildArena();
            Hud.SetPrompt(q.prompt);

            int n = q.options.Length;
            _answerBlocks = new GameObject[n];
            float width = 16f / n;
            for (int i = 0; i < n; i++)
            {
                _answerBlocks[i] = SceneKit.MakeAnswerBlock(_arena.transform, q.options[i],
                    new Vector3(-8f + width * (i + 0.5f), 0.9f, -4f), new Vector3(width * 0.85f, 1.6f, 0.5f),
                    SceneKit.OptionColors[i % SceneKit.OptionColors.Length]);
            }
            _active = true;
        }

        private void BuildArena()
        {
            _arena = new GameObject("Arena");
            SceneKit.MakeGround(_arena.transform, new Vector3(0, -0.5f, 2f),
                new Vector3(20f, 1f, 22f), new Color(0.25f, 0.18f, 0.28f));

            _boss = GameObject.CreatePrimitive(PrimitiveType.Cube);
            _boss.name = "Guardian";
            _boss.transform.SetParent(_arena.transform);
            _boss.transform.position = new Vector3(0, 2.2f, 9f);
            _boss.transform.localScale = new Vector3(4f, 4.4f, 3f);
            SceneKit.Tint(_boss, new Color(0.45f, 0.12f, 0.12f));

            _bossMaxHp = SessionQuestions.Count;
            _bossHp = _bossMaxHp;
            _hearts = playerHearts;
            _bossHpLabel = SceneKit.MakeLabel(_boss.transform, BossHpText(), new Vector3(0, 0.75f, 0), 0.35f);
            var heartsAnchor = new GameObject("HeartsAnchor");
            heartsAnchor.transform.SetParent(_arena.transform);
            heartsAnchor.transform.position = new Vector3(-8f, 4f, -2f);
            _heartsLabel = SceneKit.MakeLabel(heartsAnchor.transform, HeartsText(), Vector3.zero, 0.6f);
        }

        private string BossHpText() => $"Wächter: {_bossHp}/{_bossMaxHp}";
        private string HeartsText() => new string('♥', Mathf.Max(_hearts, 0));

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
                    ApplyBattle(correct);
                    SubmitAnswer(correct);
                    return;
                }
            }
        }

        private void ApplyBattle(bool correct)
        {
            if (correct)
            {
                _bossHp--;
                _boss.transform.localScale *= 0.93f; // armor visibly chips away
                SceneKit.Tint(_boss, Color.Lerp(new Color(0.45f, 0.12f, 0.12f), Color.gray,
                    1f - (float)_bossHp / _bossMaxHp));
            }
            else
            {
                _hearts--;
            }
            _bossHpLabel.text = BossHpText();
            _heartsLabel.text = HeartsText();
        }

        protected override void OnBeforeNextQuestion()
        {
            // Hearts gone: end the run early but still show encouraging results.
            if (_hearts <= 0 && CurrentIndex < SessionQuestions.Count - 1)
            {
                Hud.SetPrompt("Der Wächter war diesmal stärker – gleich nochmal!");
                EndSessionEarly();
            }
        }

        protected override void OnSessionFinished()
        {
            base.OnSessionFinished();
            if (_arena != null) { Destroy(_arena); _arena = null; }
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
