using BibleArcade.Data;
using UnityEngine;

namespace BibleArcade.MiniGames
{
    /// <summary>
    /// "Karten der Weisheit" — duel-inspired card game. An opponent figure plays
    /// a question card onto the table; the player holds the answer options as a
    /// fan of cards. Play the right card to win the trick and push the duel
    /// marker toward the opponent. Best-of-session decides the duel.
    /// </summary>
    public class CardDuelGame : MiniGameBase
    {
        private GameObject _root, _marker;
        private GameObject[] _cards;
        private int _score; // positive = player winning
        private bool _active;
        private Camera _cam;

        protected override QuestionType[] SupportedTypes =>
            new[] { QuestionType.MultipleChoice };

        protected override void Start()
        {
            _cam = SceneKit.EnsureCamera(new Vector3(0, 7f, -9f), new Vector3(35f, 0, 0));
            SceneKit.EnsureLight();
            base.Start();
        }

        protected override void PresentQuestion(Question q)
        {
            if (_root == null) BuildTable();
            Hud.SetPrompt("Gegner spielt: " + q.prompt);

            int n = q.options.Length;
            _cards = new GameObject[n];
            for (int i = 0; i < n; i++)
            {
                float x = -6f + 12f * i / Mathf.Max(n - 1, 1);
                var card = SceneKit.MakeAnswerBlock(_root.transform, q.options[i],
                    new Vector3(x, 0.7f, -3.5f), new Vector3(3.4f, 0.1f, 2.2f),
                    new Color(0.92f, 0.88f, 0.78f));
                card.transform.rotation = Quaternion.Euler(0, (x / 6f) * 8f, 0); // fan effect
                var label = card.GetComponentInChildren<TextMesh>();
                label.color = Color.black;
                label.transform.localPosition = new Vector3(0, 6f, 0);
                _cards[i] = card;
            }
            _active = true;
        }

        private void BuildTable()
        {
            _root = new GameObject("DuelTable");
            SceneKit.MakeGround(_root.transform, new Vector3(0, 0, 0),
                new Vector3(18f, 0.4f, 14f), new Color(0.12f, 0.35f, 0.22f));

            var opponent = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            opponent.name = "Opponent";
            opponent.transform.SetParent(_root.transform);
            opponent.transform.position = new Vector3(0, 1.6f, 7.5f);
            SceneKit.Tint(opponent, new Color(0.4f, 0.2f, 0.5f));

            _marker = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            _marker.name = "DuelMarker";
            _marker.transform.SetParent(_root.transform);
            _marker.transform.position = new Vector3(8f, 0.6f, 2f);
            SceneKit.Tint(_marker, new Color(0.95f, 0.9f, 0.3f));
            _score = 0;
        }

        private void Update()
        {
            if (!_active || _cards == null) return;
            var hit = SceneKit.PickOnClick(_cam);
            if (hit == null) return;

            for (int i = 0; i < _cards.Length; i++)
            {
                if (_cards[i] != null && hit.gameObject == _cards[i])
                {
                    _active = false;
                    bool correct = i == CurrentQuestion.correctIndex;
                    SceneKit.Tint(_cards[i], correct ? Color.green : Color.red);
                    SceneKit.Tint(_cards[CurrentQuestion.correctIndex], Color.green);
                    // played card slides to the table center
                    _cards[i].transform.position = new Vector3(0, 0.8f, 2f);

                    _score += correct ? 1 : -1;
                    _marker.transform.position = new Vector3(8f, 0.6f, 2f + _score * 0.8f);
                    SubmitAnswer(correct);
                    return;
                }
            }
        }

        protected override void OnSessionFinished()
        {
            base.OnSessionFinished();
            if (_root != null) { Destroy(_root); _root = null; }
        }

        protected override void CleanupQuestion()
        {
            _active = false;
            if (_cards == null) return;
            foreach (var c in _cards) if (c != null) Destroy(c);
            _cards = null;
        }
    }
}
