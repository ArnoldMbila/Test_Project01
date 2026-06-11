using System.Collections.Generic;
using System.IO;
using System.Linq;
using BibleArcade.Data;
using UnityEngine;

namespace BibleArcade.Core
{
    /// <summary>
    /// Loads all question banks from StreamingAssets/Questions/*.json and serves
    /// filtered, shuffled question sets to mini-games. Pure data service; no UI.
    /// </summary>
    public class QuestionDatabase : MonoBehaviour
    {
        private readonly Dictionary<string, QuestionBank> _banks = new Dictionary<string, QuestionBank>();
        public bool IsLoaded { get; private set; }

        private void Awake()
        {
            LoadAllBanks();
        }

        public void LoadAllBanks()
        {
            _banks.Clear();
            string dir = Path.Combine(Application.streamingAssetsPath, "Questions");
            if (!Directory.Exists(dir))
            {
                Debug.LogError($"[QuestionDatabase] Missing folder: {dir}");
                return;
            }

            foreach (string file in Directory.GetFiles(dir, "*.json"))
            {
                try
                {
                    var bank = JsonUtility.FromJson<QuestionBank>(File.ReadAllText(file));
                    if (bank == null || string.IsNullOrEmpty(bank.categoryId))
                    {
                        Debug.LogWarning($"[QuestionDatabase] Skipping invalid bank: {file}");
                        continue;
                    }
                    bank.questions = bank.questions.Where(q => q.IsValid()).ToArray();
                    _banks[bank.categoryId] = bank;
                    Debug.Log($"[QuestionDatabase] Loaded '{bank.categoryId}' with {bank.questions.Length} questions.");
                }
                catch (System.Exception e)
                {
                    Debug.LogError($"[QuestionDatabase] Failed to parse {file}: {e.Message}");
                }
            }
            IsLoaded = _banks.Count > 0;
        }

        public IReadOnlyCollection<string> CategoryIds => _banks.Keys;

        public string GetDisplayName(string categoryId) =>
            _banks.TryGetValue(categoryId, out var b) ? b.displayName : categoryId;

        /// <summary>
        /// Returns up to <paramref name="count"/> shuffled questions. Unmastered
        /// questions are preferred so weak items resurface (light spaced repetition).
        /// </summary>
        public List<Question> GetSession(string categoryId, QuestionType[] allowedTypes,
            int count, PlayerProfile profile)
        {
            if (!_banks.TryGetValue(categoryId, out var bank)) return new List<Question>();

            var pool = bank.questions
                .Where(q => allowedTypes == null || allowedTypes.Contains(q.Type))
                .ToList();
            Shuffle(pool);

            if (profile != null)
            {
                pool = pool
                    .OrderBy(q => profile.GetOrCreateMastery(q.id).IsMastered ? 1 : 0)
                    .ThenBy(q => profile.GetOrCreateMastery(q.id).streak)
                    .ToList();
            }
            return pool.Take(count).ToList();
        }

        /// <summary>Wrong-answer texts for building extra distractors in games.</summary>
        public List<string> GetDistractorTexts(string categoryId, Question exclude, int count)
        {
            if (!_banks.TryGetValue(categoryId, out var bank)) return new List<string>();
            var texts = bank.questions
                .Where(q => q != exclude && q.Type == QuestionType.MultipleChoice)
                .Select(q => q.options[q.correctIndex])
                .Distinct()
                .ToList();
            Shuffle(texts);
            return texts.Take(count).ToList();
        }

        public static void Shuffle<T>(IList<T> list)
        {
            for (int i = list.Count - 1; i > 0; i--)
            {
                int j = Random.Range(0, i + 1);
                (list[i], list[j]) = (list[j], list[i]);
            }
        }
    }
}
