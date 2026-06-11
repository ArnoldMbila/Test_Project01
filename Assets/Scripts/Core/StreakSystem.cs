using System;
using BibleArcade.Data;
using UnityEngine;

namespace BibleArcade.Core
{
    /// <summary>
    /// Two streaks: in-session answer streak (combo, resets on mistake) and
    /// daily play streak (consecutive calendar days). Combo multiplies coin
    /// payouts in mini-games; daily streak grants a login bonus.
    /// </summary>
    public class StreakSystem : MonoBehaviour
    {
        [SerializeField] private int dailyBonusCoinsPerDay = 5;
        [SerializeField] private int dailyBonusCap = 50;

        public event Action<int> SessionStreakChanged;
        public event Action<int, int> DailyStreakEvaluated; // (streakDays, bonusCoins)

        public int SessionStreak { get; private set; }
        public float ComboMultiplier => 1f + Mathf.Min(SessionStreak, 10) * 0.1f;

        private SaveSystem _save;
        private ProgressionSystem _progression;

        private void Awake()
        {
            _save = GetComponent<SaveSystem>();
            _progression = GetComponent<ProgressionSystem>();
        }

        private void Start()
        {
            EvaluateDailyStreak();
        }

        public void RegisterAnswer(bool correct)
        {
            SessionStreak = correct ? SessionStreak + 1 : 0;
            var p = _save.Profile;
            if (SessionStreak > p.bestSessionStreak) p.bestSessionStreak = SessionStreak;
            SessionStreakChanged?.Invoke(SessionStreak);
        }

        public void ResetSession()
        {
            SessionStreak = 0;
            SessionStreakChanged?.Invoke(0);
        }

        private void EvaluateDailyStreak()
        {
            var p = _save.Profile;
            var today = DateTime.UtcNow.Date;

            if (DateTime.TryParse(p.lastPlayedDateIso, null,
                    System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal,
                    out var last))
            {
                last = last.Date;
                if (last == today) return; // already counted today
                p.dailyStreak = (today - last).TotalDays <= 1.5 ? p.dailyStreak + 1 : 1;
            }
            else
            {
                p.dailyStreak = 1;
            }

            p.lastPlayedDateIso = today.ToString("yyyy-MM-dd");
            int bonus = Mathf.Min(p.dailyStreak * dailyBonusCoinsPerDay, dailyBonusCap);
            _progression.AddCoins(bonus);
            _save.Save();
            DailyStreakEvaluated?.Invoke(p.dailyStreak, bonus);
        }
    }
}
