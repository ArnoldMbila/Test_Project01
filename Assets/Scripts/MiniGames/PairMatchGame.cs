using System.Collections.Generic;
using System.Linq;
using BibleArcade.Data;
using UnityEngine;

namespace BibleArcade.MiniGames
{
    /// <summary>
    /// "Gleichnis-Paare" — match-inspired game for matching questions. Left column
    /// holds the parable terms, right column the shuffled meanings. Click one of
    /// each to pair them; correct pairs lock in green. The question counts as
    /// correct when all pairs were matched with at most one mismatch.
    /// </summary>
    public class PairMatchGame : MiniGameBase
    {
        private GameObject _root;
        private Camera _cam;
        private readonly Dictionary<Collider, int> _leftByCollider = new Dictionary<Collider, int>();
        private readonly Dictionary<Collider, int> _rightByCollider = new Dictionary<Collider, int>();
        private GameObject[] _leftBlocks, _rightBlocks;
        private int _selectedLeft = -1;
        private int _pairsLocked, _mistakes;
        private bool _active;

        protected override QuestionType[] SupportedTypes =>
            new[] { QuestionType.Matching };

        protected override void Start()
        {
            _cam = SceneKit.EnsureCamera(new Vector3(0, 1.5f, -13f), new Vector3(4f, 0, 0));
            SceneKit.EnsureLight();
            base.Start();
        }

        protected override void PresentQuestion(Question q)
        {
            Hud.SetPrompt(q.prompt);
            _root = new GameObject("PairBoard");
            _leftByCollider.Clear();
            _rightByCollider.Clear();
            _selectedLeft = -1;
            _pairsLocked = 0;
            _mistakes = 0;

            int n = q.pairs.Length;
            var rightOrder = Enumerable.Range(0, n).ToList();
            QuestionDatabaseShuffle(rightOrder);

            _leftBlocks = new GameObject[n];
            _rightBlocks = new GameObject[n];
            float spacing = 2.4f;
            float top = (n - 1) * spacing / 2f;

            for (int i = 0; i < n; i++)
            {
                _leftBlocks[i] = SceneKit.MakeAnswerBlock(_root.transform, q.pairs[i].left,
                    new Vector3(-5.5f, top - i * spacing, 0), new Vector3(4.5f, 1.6f, 0.4f),
                    new Color(0.22f, 0.40f, 0.75f));
                _leftByCollider[_leftBlocks[i].GetComponent<Collider>()] = i;

                int pairIdx = rightOrder[i];
                _rightBlocks[pairIdx] = SceneKit.MakeAnswerBlock(_root.transform, q.pairs[pairIdx].right,
                    new Vector3(5.5f, top - i * spacing, 0), new Vector3(4.5f, 1.6f, 0.4f),
                    new Color(0.60f, 0.42f, 0.20f));
                _rightByCollider[_rightBlocks[pairIdx].GetComponent<Collider>()] = pairIdx;
            }
            _active = true;
        }

        private static void QuestionDatabaseShuffle(List<int> list) =>
            Core.QuestionDatabase.Shuffle(list);

        private void Update()
        {
            if (!_active) return;
            var hit = SceneKit.PickOnClick(_cam);
            if (hit == null) return;

            if (_leftByCollider.TryGetValue(hit, out int leftIdx))
            {
                Services.Audio.PlayClick();
                if (_selectedLeft >= 0) SceneKit.Tint(_leftBlocks[_selectedLeft], new Color(0.22f, 0.40f, 0.75f));
                _selectedLeft = leftIdx;
                SceneKit.Tint(_leftBlocks[leftIdx], new Color(0.95f, 0.9f, 0.3f));
            }
            else if (_selectedLeft >= 0 && _rightByCollider.TryGetValue(hit, out int rightIdx))
            {
                if (rightIdx == _selectedLeft)
                {
                    LockPair(_selectedLeft);
                }
                else
                {
                    _mistakes++;
                    Services.Audio.PlayWrong();
                    SceneKit.Tint(_rightBlocks[rightIdx], Color.red);
                    StartCoroutine(ResetTint(_rightBlocks[rightIdx], new Color(0.60f, 0.42f, 0.20f)));
                    SceneKit.Tint(_leftBlocks[_selectedLeft], new Color(0.22f, 0.40f, 0.75f));
                    _selectedLeft = -1;
                }
            }
        }

        private void LockPair(int idx)
        {
            SceneKit.Tint(_leftBlocks[idx], Color.green);
            SceneKit.Tint(_rightBlocks[idx], Color.green);
            _leftByCollider.Remove(_leftBlocks[idx].GetComponent<Collider>());
            _rightByCollider.Remove(_rightBlocks[idx].GetComponent<Collider>());
            _selectedLeft = -1;
            _pairsLocked++;
            Services.Audio.PlayCoin();

            if (_pairsLocked >= CurrentQuestion.pairs.Length)
            {
                _active = false;
                SubmitAnswer(_mistakes <= 1);
            }
        }

        private System.Collections.IEnumerator ResetTint(GameObject go, Color back)
        {
            yield return new WaitForSeconds(0.4f);
            if (go != null) SceneKit.Tint(go, back);
        }

        protected override void CleanupQuestion()
        {
            _active = false;
            if (_root != null) Destroy(_root);
        }
    }
}
