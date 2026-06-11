using System.Collections;
using System.Collections.Generic;
using BibleArcade.Core;
using BibleArcade.Data;
using BibleArcade.UI;
using UnityEngine;

namespace BibleArcade.MiniGames
{
    /// <summary>
    /// Base for all mini-games. Handles the shared session loop:
    /// fetch questions → present one → receive answer → feedback pause → next →
    /// results screen. Subclasses implement only PresentQuestion/CleanupQuestion
    /// and call SubmitAnswer when the player commits.
    ///
    /// Sessions are deliberately short (default 6 questions ≈ 3-4 minutes) so a
    /// full loop with reward always fits inside one attention span.
    /// </summary>
    public abstract class MiniGameBase : MonoBehaviour
    {
        [Header("Session")]
        [SerializeField] protected string categoryId = "grundstufe";
        [SerializeField] protected int questionsPerSession = 6;

        protected GameServices Services => GameServices.Instance;
        protected HUDController Hud { get; private set; }

        protected List<Question> SessionQuestions { get; private set; }
        protected Question CurrentQuestion { get; private set; }
        protected int CurrentIndex { get; private set; } = -1;
        protected int CorrectCount { get; private set; }

        private float _questionStartTime;
        private bool _answerLocked;

        /// <summary>Question types this game can host.</summary>
        protected abstract QuestionType[] SupportedTypes { get; }

        /// <summary>Set category before the game starts (used by the arcade launcher).</summary>
        public void Configure(string category, int questionCount = 0)
        {
            categoryId = category;
            if (questionCount > 0) questionsPerSession = questionCount;
        }

        /// <summary>Build the 3D/UI presentation for one question.</summary>
        protected abstract void PresentQuestion(Question question);

        /// <summary>Tear down whatever PresentQuestion built.</summary>
        protected abstract void CleanupQuestion();

        protected virtual void Start()
        {
            Hud = HUDController.Ensure();
            StartSession();
        }

        public virtual void StartSession()
        {
            SessionQuestions = Services.Questions.GetSession(
                categoryId, SupportedTypes, questionsPerSession, Services.Save.Profile);
            CurrentIndex = -1;
            CorrectCount = 0;
            Services.Streaks.ResetSession();

            if (SessionQuestions.Count == 0)
            {
                Debug.LogError($"[{GetType().Name}] No questions for '{categoryId}' " +
                               $"matching types {string.Join(",", (object[])SupportedTypes)}.");
                return;
            }
            NextQuestion();
        }

        protected void NextQuestion()
        {
            CleanupQuestion();
            CurrentIndex++;

            if (CurrentIndex >= SessionQuestions.Count)
            {
                OnSessionFinished();
                return;
            }

            CurrentQuestion = SessionQuestions[CurrentIndex];
            _answerLocked = false;
            _questionStartTime = Time.time;
            Hud.SetProgress(CurrentIndex + 1, SessionQuestions.Count);
            PresentQuestion(CurrentQuestion);
        }

        /// <summary>Called by subclasses when the player commits an answer.</summary>
        protected void SubmitAnswer(bool correct)
        {
            if (_answerLocked) return;
            _answerLocked = true;

            if (correct) CorrectCount++;
            float seconds = Time.time - _questionStartTime;
            float pause = Services.Feedback.Report(new AnswerResult(CurrentQuestion, correct, seconds));
            StartCoroutine(AdvanceAfter(pause));
        }

        protected bool AnswerLocked => _answerLocked;

        /// <summary>Skip all remaining questions and go straight to results.</summary>
        protected void EndSessionEarly()
        {
            CurrentIndex = SessionQuestions.Count - 1;
        }

        private IEnumerator AdvanceAfter(float seconds)
        {
            yield return new WaitForSeconds(seconds);
            OnBeforeNextQuestion();
            NextQuestion();
        }

        /// <summary>Hook for games that animate between questions.</summary>
        protected virtual void OnBeforeNextQuestion() { }

        protected virtual void OnSessionFinished()
        {
            Hud.ShowResults(CorrectCount, SessionQuestions.Count, RestartSession);
        }

        private void RestartSession()
        {
            StartSession();
        }
    }
}
