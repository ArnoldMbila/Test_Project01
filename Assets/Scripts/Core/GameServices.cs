using UnityEngine;

namespace BibleArcade.Core
{
    /// <summary>
    /// Composition root. Drop one "GameServices" GameObject into the boot scene
    /// (or let any mini-game auto-create it) and every core system is wired up
    /// and survives scene loads. Access via GameServices.Instance.
    /// </summary>
    [DefaultExecutionOrder(-100)]
    public class GameServices : MonoBehaviour
    {
        private static GameServices _instance;

        public static GameServices Instance
        {
            get
            {
                if (_instance == null)
                {
                    var go = new GameObject("GameServices");
                    _instance = go.AddComponent<GameServices>();
                }
                return _instance;
            }
        }

        public QuestionDatabase Questions { get; private set; }
        public SaveSystem Save { get; private set; }
        public ProgressionSystem Progression { get; private set; }
        public StreakSystem Streaks { get; private set; }
        public AudioManager Audio { get; private set; }
        public FeedbackSystem Feedback { get; private set; }

        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(gameObject);
                return;
            }
            _instance = this;
            DontDestroyOnLoad(gameObject);

            // Order matters: SaveSystem first (others read Profile in Awake/Start).
            Save = GetOrAdd<SaveSystem>();
            Questions = GetOrAdd<QuestionDatabase>();
            Progression = GetOrAdd<ProgressionSystem>();
            Streaks = GetOrAdd<StreakSystem>();
            Audio = GetOrAdd<AudioManager>();
            Feedback = GetOrAdd<FeedbackSystem>();
        }

        private T GetOrAdd<T>() where T : Component
        {
            var c = GetComponent<T>();
            return c != null ? c : gameObject.AddComponent<T>();
        }
    }
}
