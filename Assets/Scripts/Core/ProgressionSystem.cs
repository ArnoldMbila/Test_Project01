using System;
using BibleArcade.Data;
using UnityEngine;

namespace BibleArcade.Core
{
    /// <summary>
    /// XP, levels, coins and per-question mastery. All reward maths lives here so
    /// every mini-game pays out consistently. Raises events the HUD subscribes to.
    /// </summary>
    public class ProgressionSystem : MonoBehaviour
    {
        [Header("Reward Tuning")]
        [SerializeField] private int xpPerCorrect = 10;
        [SerializeField] private int xpDifficultyBonus = 5;   // per difficulty point above 1
        [SerializeField] private int xpSpeedBonus = 5;        // answered under speedThreshold
        [SerializeField] private float speedThresholdSeconds = 5f;
        [SerializeField] private int coinsPerCorrect = 2;
        [SerializeField] private int coinsMasteryBonus = 10;  // first time a question reaches mastery

        public event Action<int, int> XpChanged;      // (newXp, newLevel)
        public event Action<int> CoinsChanged;        // newCoins
        public event Action<Question> QuestionMastered;

        private SaveSystem _save;

        public PlayerProfile Profile => _save.Profile;
        public int Level => LevelForXp(Profile.xp);
        public static int LevelForXp(int xp) => 1 + Mathf.FloorToInt(Mathf.Sqrt(xp / 100f));
        public static int XpForLevel(int level) => (level - 1) * (level - 1) * 100;

        private void Awake()
        {
            _save = GetComponent<SaveSystem>();
        }

        /// <summary>Apply one answer: updates mastery, pays XP/coins, returns XP gained.</summary>
        public int RegisterAnswer(AnswerResult result)
        {
            var m = Profile.GetOrCreateMastery(result.Question.id);
            m.timesSeen++;
            bool wasMastered = m.IsMastered;

            int xpGain = 0, coinGain = 0;
            if (result.Correct)
            {
                m.timesCorrect++;
                m.streak++;
                xpGain = xpPerCorrect + (result.Question.difficulty - 1) * xpDifficultyBonus;
                if (result.AnswerTimeSeconds <= speedThresholdSeconds) xpGain += xpSpeedBonus;
                coinGain = coinsPerCorrect;

                if (!wasMastered && m.IsMastered)
                {
                    coinGain += coinsMasteryBonus;
                    QuestionMastered?.Invoke(result.Question);
                }
            }
            else
            {
                m.streak = 0;
            }

            if (xpGain > 0) AddXp(xpGain);
            if (coinGain > 0) AddCoins(coinGain);
            return xpGain;
        }

        public void AddXp(int amount)
        {
            Profile.xp += amount;
            XpChanged?.Invoke(Profile.xp, Level);
        }

        public void AddCoins(int amount)
        {
            Profile.coins += amount;
            CoinsChanged?.Invoke(Profile.coins);
        }

        public bool TrySpendCoins(int amount)
        {
            if (Profile.coins < amount) return false;
            Profile.coins -= amount;
            CoinsChanged?.Invoke(Profile.coins);
            _save.Save();
            return true;
        }
    }
}
