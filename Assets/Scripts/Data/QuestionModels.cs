using System;
using System.Collections.Generic;
using UnityEngine;

namespace BibleArcade.Data
{
    /// <summary>
    /// Question types supported by the engine. Stored as string in JSON,
    /// parsed once on load. Each mini-game declares which types it can host.
    /// </summary>
    public enum QuestionType
    {
        MultipleChoice,
        Ordering,
        Matching
    }

    [Serializable]
    public class QuestionPair
    {
        public string left;
        public string right;
    }

    [Serializable]
    public class Question
    {
        public string id;
        public string type;
        public string prompt;

        // multipleChoice
        public string[] options;
        public int correctIndex;

        // ordering
        public string[] orderedItems;

        // matching
        public QuestionPair[] pairs;

        public string explanation;
        public string reference;
        public int difficulty = 1;

        [NonSerialized] private QuestionType? _parsedType;

        public QuestionType Type
        {
            get
            {
                if (!_parsedType.HasValue)
                {
                    switch (type)
                    {
                        case "ordering": _parsedType = QuestionType.Ordering; break;
                        case "matching": _parsedType = QuestionType.Matching; break;
                        default: _parsedType = QuestionType.MultipleChoice; break;
                    }
                }
                return _parsedType.Value;
            }
        }

        public bool IsValid()
        {
            if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(prompt)) return false;
            switch (Type)
            {
                case QuestionType.MultipleChoice:
                    return options != null && options.Length >= 2
                        && correctIndex >= 0 && correctIndex < options.Length;
                case QuestionType.Ordering:
                    return orderedItems != null && orderedItems.Length >= 3;
                case QuestionType.Matching:
                    return pairs != null && pairs.Length >= 2;
                default:
                    return false;
            }
        }
    }

    [Serializable]
    public class QuestionBank
    {
        public string categoryId;
        public string displayName;
        public Question[] questions;
    }

    /// <summary>Result of one answered question, consumed by progression/feedback.</summary>
    public struct AnswerResult
    {
        public Question Question;
        public bool Correct;
        public float AnswerTimeSeconds;

        public AnswerResult(Question q, bool correct, float seconds)
        {
            Question = q;
            Correct = correct;
            AnswerTimeSeconds = seconds;
        }
    }

    /// <summary>Persistent player state. Serialized via SaveSystem.</summary>
    [Serializable]
    public class PlayerProfile
    {
        public int xp;
        public int coins;
        public int dailyStreak;
        public string lastPlayedDateIso = "";
        public int bestSessionStreak;
        public List<QuestionMastery> mastery = new List<QuestionMastery>();
        public List<string> unlockedBuildings = new List<string>();

        public QuestionMastery GetOrCreateMastery(string questionId)
        {
            for (int i = 0; i < mastery.Count; i++)
                if (mastery[i].questionId == questionId) return mastery[i];
            var m = new QuestionMastery { questionId = questionId };
            mastery.Add(m);
            return m;
        }
    }

    [Serializable]
    public class QuestionMastery
    {
        public string questionId;
        public int timesSeen;
        public int timesCorrect;
        public int streak; // consecutive correct; 3+ counts as mastered

        public bool IsMastered => streak >= 3;
        public float Accuracy => timesSeen == 0 ? 0f : (float)timesCorrect / timesSeen;
    }
}
