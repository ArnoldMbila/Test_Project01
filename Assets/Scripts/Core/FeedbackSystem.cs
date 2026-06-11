using System;
using System.Collections;
using BibleArcade.Data;
using UnityEngine;

namespace BibleArcade.Core
{
    /// <summary>
    /// Instant feedback hub: routes every answer to audio, streaks, progression
    /// and the UI popup. Mini-games call exactly one method (Report) and the
    /// whole reward/explanation pipeline runs — keeps games dumb and consistent.
    ///
    /// ADHD-friendly rules implemented here:
    ///  - feedback within one frame of the answer,
    ///  - mistakes show a short explanation card (learning moment, no punishment),
    ///  - correct answers celebrate briefly and move on fast.
    /// </summary>
    public class FeedbackSystem : MonoBehaviour
    {
        [SerializeField] private float correctDisplaySeconds = 1.2f;
        [SerializeField] private float explanationDisplaySeconds = 5f;

        /// <summary>(result, xpGained, explanationShown) — UI layers subscribe here.</summary>
        public event Action<AnswerResult, int, bool> FeedbackIssued;

        private ProgressionSystem _progression;
        private StreakSystem _streaks;
        private AudioManager _audio;
        private SaveSystem _save;

        public float CorrectDisplaySeconds => correctDisplaySeconds;
        public float ExplanationDisplaySeconds => explanationDisplaySeconds;

        private void Awake()
        {
            _progression = GetComponent<ProgressionSystem>();
            _streaks = GetComponent<StreakSystem>();
            _audio = GetComponent<AudioManager>();
            _save = GetComponent<SaveSystem>();
        }

        /// <summary>
        /// Single entry point for mini-games. Returns the seconds the game should
        /// pause before presenting the next question (longer after a mistake so
        /// the explanation can be read).
        /// </summary>
        public float Report(AnswerResult result)
        {
            int levelBefore = _progression.Level;

            _streaks.RegisterAnswer(result.Correct);
            int xp = _progression.RegisterAnswer(result);

            if (result.Correct)
            {
                _audio.PlayCorrect();
                if (_progression.Level > levelBefore) _audio.PlayLevelUp();
                else if (xp > 0) StartCoroutine(DelayedCoin());
            }
            else
            {
                _audio.PlayWrong();
            }

            _save.Save();

            bool showExplanation = !result.Correct && !string.IsNullOrEmpty(result.Question.explanation);
            FeedbackIssued?.Invoke(result, xp, showExplanation);
            return showExplanation ? explanationDisplaySeconds : correctDisplaySeconds;
        }

        private IEnumerator DelayedCoin()
        {
            yield return new WaitForSeconds(0.15f);
            _audio.PlayCoin();
        }
    }
}
