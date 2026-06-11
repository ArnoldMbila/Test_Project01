using System.Collections.Generic;
using System.Linq;
using BibleArcade.Data;
using UnityEngine;

namespace BibleArcade.MiniGames
{
    /// <summary>
    /// "Brücke der Zeitalter" — order-puzzle game for ordering questions. The
    /// shuffled steps float as stones; click them in the correct sequence and
    /// each one flies into place as the next plank of a bridge across a chasm.
    /// A wrong pick shakes the stone. Correct = at most one wrong pick overall.
    /// </summary>
    public class OrderPuzzleGame : MiniGameBase
    {
        private GameObject _root;
        private Camera _cam;
        private readonly Dictionary<Collider, int> _stoneByCollider = new Dictionary<Collider, int>();
        private GameObject[] _stones;
        private int _nextExpected, _mistakes;
        private bool _active;

        protected override QuestionType[] SupportedTypes =>
            new[] { QuestionType.Ordering };

        protected override void Start()
        {
            _cam = SceneKit.EnsureCamera(new Vector3(0, 4f, -14f), new Vector3(10f, 0, 0));
            SceneKit.EnsureLight();
            base.Start();
        }

        protected override void PresentQuestion(Question q)
        {
            Hud.SetPrompt(q.prompt);
            _root = new GameObject("Bridge");
            _stoneByCollider.Clear();
            _nextExpected = 0;
            _mistakes = 0;

            // two cliffs and a gap the bridge will span
            SceneKit.MakeGround(_root.transform, new Vector3(-11f, -1f, 4f), new Vector3(8f, 2f, 10f), new Color(0.25f, 0.30f, 0.25f));
            SceneKit.MakeGround(_root.transform, new Vector3(11f, -1f, 4f), new Vector3(8f, 2f, 10f), new Color(0.25f, 0.30f, 0.25f));

            int n = q.orderedItems.Length;
            var shuffled = Enumerable.Range(0, n).ToList();
            Core.QuestionDatabase.Shuffle(shuffled);

            _stones = new GameObject[n];
            int cols = Mathf.CeilToInt(n / 2f);
            for (int s = 0; s < n; s++)
            {
                int orderIdx = shuffled[s];
                int row = s / cols, col = s % cols;
                var pos = new Vector3(-6f + col * (12f / Mathf.Max(cols - 1, 1)), 4.5f - row * 2.6f, -2f);
                _stones[orderIdx] = SceneKit.MakeAnswerBlock(_root.transform, q.orderedItems[orderIdx],
                    pos, new Vector3(3.6f, 1.4f, 0.5f), new Color(0.45f, 0.45f, 0.55f));
                _stoneByCollider[_stones[orderIdx].GetComponent<Collider>()] = orderIdx;
            }
            _active = true;
        }

        private void Update()
        {
            if (!_active) return;
            var hit = SceneKit.PickOnClick(_cam);
            if (hit == null || !_stoneByCollider.TryGetValue(hit, out int orderIdx)) return;

            if (orderIdx == _nextExpected)
            {
                PlaceStone(orderIdx);
            }
            else
            {
                _mistakes++;
                Services.Audio.PlayWrong();
                StartCoroutine(Shake(_stones[orderIdx]));
            }
        }

        private void PlaceStone(int orderIdx)
        {
            Services.Audio.PlayCoin();
            var stone = _stones[orderIdx];
            _stoneByCollider.Remove(stone.GetComponent<Collider>());

            int n = CurrentQuestion.orderedItems.Length;
            float bridgeSpan = 14f;
            float x = -bridgeSpan / 2f + bridgeSpan * (orderIdx + 0.5f) / n;
            stone.transform.position = new Vector3(x, 0f, 4f);
            stone.transform.localScale = new Vector3(bridgeSpan / n * 0.95f, 0.5f, 2.5f);
            SceneKit.Tint(stone, new Color(0.75f, 0.6f, 0.3f));

            _nextExpected++;
            if (_nextExpected >= n)
            {
                _active = false;
                SubmitAnswer(_mistakes <= 1);
            }
        }

        private System.Collections.IEnumerator Shake(GameObject stone)
        {
            var origin = stone.transform.position;
            for (float t = 0; t < 0.3f; t += Time.deltaTime)
            {
                stone.transform.position = origin + Random.insideUnitSphere * 0.12f;
                yield return null;
            }
            if (stone != null) stone.transform.position = origin;
        }

        protected override void CleanupQuestion()
        {
            _active = false;
            if (_root != null) Destroy(_root);
        }
    }
}
