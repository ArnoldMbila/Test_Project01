using System.Collections.Generic;
using BibleArcade.Data;
using UnityEngine;

namespace BibleArcade.MiniGames
{
    /// <summary>
    /// "Stadt des Lichts" — kingdom-builder-inspired meta-game and long-term
    /// motivation loop. Coins earned in every mini-game buy buildings on a 3D
    /// plot; each purchase requires answering one question first ("Bauprüfung").
    /// Owned buildings persist in the save file, so the city visibly grows with
    /// the player's knowledge across sessions.
    /// </summary>
    public class KingdomBuilderGame : MiniGameBase
    {
        [System.Serializable]
        public struct BuildingDef
        {
            public string id;
            public string label;
            public int cost;
            public Vector3 size;
            public Color color;

            public BuildingDef(string id, string label, int cost, Vector3 size, Color color)
            {
                this.id = id; this.label = label; this.cost = cost; this.size = size; this.color = color;
            }
        }

        private static readonly BuildingDef[] Catalog =
        {
            new BuildingDef("well",    "Brunnen (10)",     10, new Vector3(1.2f, 1.0f, 1.2f), new Color(0.4f, 0.6f, 0.9f)),
            new BuildingDef("house",   "Haus (25)",        25, new Vector3(2.0f, 1.8f, 2.0f), new Color(0.8f, 0.7f, 0.5f)),
            new BuildingDef("garden",  "Garten (40)",      40, new Vector3(3.0f, 0.4f, 3.0f), new Color(0.3f, 0.7f, 0.3f)),
            new BuildingDef("tower",   "Wachturm (60)",    60, new Vector3(1.5f, 4.0f, 1.5f), new Color(0.6f, 0.6f, 0.7f)),
            new BuildingDef("hall",    "Halle (100)",     100, new Vector3(4.0f, 2.5f, 3.0f), new Color(0.85f, 0.8f, 0.6f)),
            new BuildingDef("beacon",  "Leuchtfeuer (150)",150, new Vector3(1.2f, 5.5f, 1.2f), new Color(1.0f, 0.85f, 0.3f))
        };

        private GameObject _root;
        private Camera _cam;
        private readonly Dictionary<Collider, BuildingDef> _shopByCollider = new Dictionary<Collider, BuildingDef>();
        private BuildingDef? _pendingPurchase;
        private GameObject[] _answerBlocks;
        private bool _quizActive;

        protected override QuestionType[] SupportedTypes =>
            new[] { QuestionType.MultipleChoice };

        protected override void Start()
        {
            _cam = SceneKit.EnsureCamera(new Vector3(0, 14f, -16f), new Vector3(40f, 0, 0));
            SceneKit.EnsureLight();
            base.Start();
        }

        // The builder runs its own loop instead of the base session loop:
        // browse city → pick building → answer one question → building placed.
        public override void StartSession()
        {
            BuildCity();
            ShowShopPrompt();
        }

        protected override void PresentQuestion(Question q)
        {
            Hud.SetPrompt("Bauprüfung: " + q.prompt);
            int n = q.options.Length;
            _answerBlocks = new GameObject[n];
            float width = 18f / n;
            for (int i = 0; i < n; i++)
            {
                _answerBlocks[i] = SceneKit.MakeAnswerBlock(_root.transform, q.options[i],
                    new Vector3(-9f + width * (i + 0.5f), 1.2f, -8f),
                    new Vector3(width * 0.85f, 2f, 0.5f),
                    SceneKit.OptionColors[i % SceneKit.OptionColors.Length]);
            }
            _quizActive = true;
        }

        private void BuildCity()
        {
            if (_root != null) Destroy(_root);
            _root = new GameObject("City");
            SceneKit.MakeGround(_root.transform, Vector3.zero, new Vector3(26f, 0.5f, 22f),
                new Color(0.35f, 0.45f, 0.30f));

            // already-owned buildings, laid out on a grid in purchase order
            var owned = Services.Save.Profile.unlockedBuildings;
            for (int i = 0; i < owned.Count; i++)
            {
                var def = FindDef(owned[i]);
                if (def.HasValue) PlaceBuilding(def.Value, i, false);
            }

            // shop row along the back edge
            _shopByCollider.Clear();
            for (int i = 0; i < Catalog.Length; i++)
            {
                var def = Catalog[i];
                var block = SceneKit.MakeAnswerBlock(_root.transform, def.label,
                    new Vector3(-10f + i * 4f, 1f, 9.5f), new Vector3(3.2f, 1.6f, 0.5f),
                    Services.Save.Profile.coins >= def.cost ? def.color : Color.gray);
                _shopByCollider[block.GetComponent<Collider>()] = def;
            }
        }

        private static BuildingDef? FindDef(string id)
        {
            foreach (var d in Catalog) if (d.id == id) return d;
            return null;
        }

        private void PlaceBuilding(BuildingDef def, int slot, bool celebrate)
        {
            int col = slot % 5, row = slot / 5;
            var b = GameObject.CreatePrimitive(PrimitiveType.Cube);
            b.name = "Building_" + def.id;
            b.transform.SetParent(_root.transform);
            b.transform.position = new Vector3(-8f + col * 4f, def.size.y / 2f + 0.25f, 4f - row * 4f);
            b.transform.localScale = def.size;
            SceneKit.Tint(b, def.color);
            if (celebrate) Services.Audio.PlayLevelUp();
        }

        private void ShowShopPrompt()
        {
            Hud.SetPrompt($"Stadt des Lichts – Münzen: {Services.Save.Profile.coins}. " +
                          "Klicke ein Gebäude im Schaufenster, um es zu bauen!");
        }

        private void Update()
        {
            var hit = SceneKit.PickOnClick(_cam);
            if (hit == null) return;

            if (_quizActive && _answerBlocks != null)
            {
                for (int i = 0; i < _answerBlocks.Length; i++)
                {
                    if (_answerBlocks[i] != null && hit.gameObject == _answerBlocks[i])
                    {
                        _quizActive = false;
                        bool correct = i == CurrentQuestion.correctIndex;
                        SceneKit.Tint(_answerBlocks[i], correct ? Color.green : Color.red);
                        SceneKit.Tint(_answerBlocks[CurrentQuestion.correctIndex], Color.green);
                        ResolvePurchase(correct);
                        return;
                    }
                }
                return;
            }

            if (_shopByCollider.TryGetValue(hit, out var def))
            {
                if (Services.Save.Profile.coins < def.cost)
                {
                    Services.Audio.PlayWrong();
                    Hud.SetPrompt($"Noch nicht genug Münzen für {def.label}. Spiele andere Spiele, um mehr zu verdienen!");
                    return;
                }
                Services.Audio.PlayClick();
                _pendingPurchase = def;
                StartQuizForPurchase();
            }
        }

        private void StartQuizForPurchase()
        {
            var questions = Services.Questions.GetSession(categoryId, SupportedTypes, 1, Services.Save.Profile);
            if (questions.Count == 0) { CompletePurchase(); return; }
            SetCurrentQuestionForBuilder(questions[0]);
            PresentQuestion(questions[0]);
        }

        private Question _builderQuestion;
        private float _builderStart;

        private void SetCurrentQuestionForBuilder(Question q)
        {
            _builderQuestion = q;
            _builderStart = Time.time;
        }

        private new Question CurrentQuestion => _builderQuestion;

        private void ResolvePurchase(bool correct)
        {
            float seconds = Time.time - _builderStart;
            Services.Feedback.Report(new AnswerResult(_builderQuestion, correct, seconds));
            StartCoroutine(AfterFeedback(correct));
        }

        private System.Collections.IEnumerator AfterFeedback(bool correct)
        {
            yield return new WaitForSeconds(correct
                ? Services.Feedback.CorrectDisplaySeconds
                : Services.Feedback.ExplanationDisplaySeconds);

            if (correct && _pendingPurchase.HasValue &&
                Services.Progression.TrySpendCoins(_pendingPurchase.Value.cost))
            {
                Services.Save.Profile.unlockedBuildings.Add(_pendingPurchase.Value.id);
                Services.Save.Save();
            }
            _pendingPurchase = null;
            CompletePurchase();
        }

        private void CompletePurchase()
        {
            CleanupQuestion();
            BuildCity();
            ShowShopPrompt();
        }

        protected override void CleanupQuestion()
        {
            _quizActive = false;
            if (_answerBlocks == null) return;
            foreach (var b in _answerBlocks) if (b != null) Destroy(b);
            _answerBlocks = null;
        }
    }
}
