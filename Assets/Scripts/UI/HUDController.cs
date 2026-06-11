using System;
using BibleArcade.Core;
using BibleArcade.Data;
using UnityEngine;
using UnityEngine.UI;

namespace BibleArcade.UI
{
    /// <summary>
    /// Code-generated HUD shared by all mini-games: XP/level, coins, combo streak,
    /// session progress, prompt banner, feedback/explanation popup and results
    /// panel. Built entirely at runtime so the project runs without any prefab
    /// or TextMeshPro setup; swap for a designed canvas later without touching
    /// game logic (games only call the public methods).
    /// </summary>
    public class HUDController : MonoBehaviour
    {
        private static HUDController _instance;

        private Text _levelText, _coinsText, _streakText, _progressText, _promptText;
        private Text _popupTitle, _popupBody;
        private Image _popupPanel;
        private GameObject _popupRoot, _resultsRoot;
        private Text _resultsText;
        private Action _onPlayAgain;

        private static readonly Color CorrectColor = new Color(0.16f, 0.55f, 0.25f, 0.95f);
        private static readonly Color WrongColor = new Color(0.62f, 0.20f, 0.16f, 0.95f);

        public static HUDController Ensure()
        {
            if (_instance != null) return _instance;
            var go = new GameObject("HUD");
            _instance = go.AddComponent<HUDController>();
            return _instance;
        }

        private void Awake()
        {
            BuildCanvas();
            var s = GameServices.Instance;
            s.Progression.XpChanged += (xp, lvl) => RefreshStats();
            s.Progression.CoinsChanged += _ => RefreshStats();
            s.Streaks.SessionStreakChanged += _ => RefreshStats();
            s.Feedback.FeedbackIssued += OnFeedback;
            RefreshStats();
        }

        public void SetPrompt(string text) => _promptText.text = text;

        /// <summary>Hide/show the whole HUD (used while the arcade menu is open).</summary>
        public static void SetVisible(bool visible)
        {
            if (_instance != null) _instance.gameObject.SetActive(visible);
        }

        public void SetProgress(int current, int total)
        {
            _progressText.text = $"Frage {current}/{total}";
            HideResults();
        }

        public void ShowResults(int correct, int total, Action onPlayAgain)
        {
            _onPlayAgain = onPlayAgain;
            _resultsRoot.SetActive(true);
            int pct = total == 0 ? 0 : Mathf.RoundToInt(100f * correct / total);
            string praise = pct >= 80 ? "Stark! 🌟" : pct >= 50 ? "Gut gemacht – weiter so!" : "Jede Runde macht dich besser!";
            _resultsText.text = $"Runde geschafft!\n\n{correct} von {total} richtig ({pct}%)\n\n{praise}";
        }

        public void HideResults() => _resultsRoot.SetActive(false);

        private void OnFeedback(AnswerResult result, int xpGained, bool explanationShown)
        {
            _popupRoot.SetActive(true);
            _popupPanel.color = result.Correct ? CorrectColor : WrongColor;
            if (result.Correct)
            {
                _popupTitle.text = $"Richtig!  +{xpGained} XP";
                _popupBody.text = "";
                CancelInvoke(nameof(HidePopup));
                Invoke(nameof(HidePopup), GameServices.Instance.Feedback.CorrectDisplaySeconds);
            }
            else
            {
                _popupTitle.text = "Nicht ganz – merk dir das:";
                _popupBody.text = result.Question.explanation;
                CancelInvoke(nameof(HidePopup));
                Invoke(nameof(HidePopup), GameServices.Instance.Feedback.ExplanationDisplaySeconds);
            }
        }

        private void HidePopup() => _popupRoot.SetActive(false);

        private void RefreshStats()
        {
            var p = GameServices.Instance.Save.Profile;
            int level = ProgressionSystem.LevelForXp(p.xp);
            _levelText.text = $"Lv {level}  ({p.xp} XP)";
            _coinsText.text = $"⬤ {p.coins}";
            int streak = GameServices.Instance.Streaks.SessionStreak;
            _streakText.text = streak >= 2 ? $"🔥 x{streak}" : "";
        }

        // ---------- runtime canvas construction ----------

        private void BuildCanvas()
        {
            var canvasGo = new GameObject("HUDCanvas");
            canvasGo.transform.SetParent(transform);
            var canvas = canvasGo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280, 720);
            canvasGo.AddComponent<GraphicRaycaster>();

            if (FindFirstObjectByType<UnityEngine.EventSystems.EventSystem>() == null)
            {
                var es = new GameObject("EventSystem");
                es.AddComponent<UnityEngine.EventSystems.EventSystem>();
                es.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
            }

            _levelText = MakeText(canvas.transform, "Level", new Vector2(0, 1), new Vector2(20, -16), new Vector2(280, 32), 22, TextAnchor.MiddleLeft);
            _coinsText = MakeText(canvas.transform, "Coins", new Vector2(0, 1), new Vector2(20, -52), new Vector2(280, 32), 22, TextAnchor.MiddleLeft);
            _coinsText.color = new Color(1f, 0.85f, 0.2f);
            _streakText = MakeText(canvas.transform, "Streak", new Vector2(1, 1), new Vector2(-150, -16), new Vector2(140, 32), 22, TextAnchor.MiddleRight);
            _streakText.color = new Color(1f, 0.5f, 0.1f);
            _progressText = MakeText(canvas.transform, "Progress", new Vector2(0.5f, 1), new Vector2(0, -16), new Vector2(300, 32), 22, TextAnchor.MiddleCenter);

            _promptText = MakeText(canvas.transform, "Prompt", new Vector2(0.5f, 1), new Vector2(0, -80), new Vector2(1100, 90), 24, TextAnchor.MiddleCenter);
            _promptText.fontStyle = FontStyle.Bold;

            // feedback popup (bottom center)
            _popupRoot = MakePanel(canvas.transform, "FeedbackPopup", new Vector2(0.5f, 0), new Vector2(0, 130), new Vector2(900, 190), out _popupPanel);
            _popupTitle = MakeText(_popupRoot.transform, "Title", new Vector2(0.5f, 1), new Vector2(0, -26), new Vector2(860, 36), 24, TextAnchor.MiddleCenter);
            _popupTitle.fontStyle = FontStyle.Bold;
            _popupBody = MakeText(_popupRoot.transform, "Body", new Vector2(0.5f, 0.5f), new Vector2(0, -22), new Vector2(860, 120), 19, TextAnchor.UpperCenter);
            _popupRoot.SetActive(false);

            // results panel (center)
            _resultsRoot = MakePanel(canvas.transform, "Results", new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(620, 360), out var resultsPanel);
            resultsPanel.color = new Color(0.10f, 0.12f, 0.22f, 0.97f);
            _resultsText = MakeText(_resultsRoot.transform, "Text", new Vector2(0.5f, 0.5f), new Vector2(0, 40), new Vector2(560, 240), 24, TextAnchor.MiddleCenter);
            var againBtn = MakeButton(_resultsRoot.transform, "Nochmal spielen", new Vector2(0.5f, 0), new Vector2(0, 50), new Vector2(280, 56));
            againBtn.onClick.AddListener(() =>
            {
                GameServices.Instance.Audio.PlayClick();
                HideResults();
                _onPlayAgain?.Invoke();
            });
            _resultsRoot.SetActive(false);
        }

        public static Text MakeText(Transform parent, string name, Vector2 anchor, Vector2 pos, Vector2 size, int fontSize, TextAnchor align)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = rt.anchorMax = rt.pivot = anchor;
            rt.anchoredPosition = pos;
            rt.sizeDelta = size;
            var t = go.AddComponent<Text>();
            t.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            t.fontSize = fontSize;
            t.alignment = align;
            t.color = Color.white;
            t.horizontalOverflow = HorizontalWrapMode.Wrap;
            t.verticalOverflow = VerticalWrapMode.Overflow;
            return t;
        }

        public static GameObject MakePanel(Transform parent, string name, Vector2 anchor, Vector2 pos, Vector2 size, out Image image)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = rt.anchorMax = rt.pivot = anchor;
            rt.anchoredPosition = pos;
            rt.sizeDelta = size;
            image = go.AddComponent<Image>();
            image.color = new Color(0f, 0f, 0f, 0.85f);
            return go;
        }

        public static Button MakeButton(Transform parent, string label, Vector2 anchor, Vector2 pos, Vector2 size)
        {
            var go = new GameObject("Button_" + label);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = rt.anchorMax = rt.pivot = anchor;
            rt.anchoredPosition = pos;
            rt.sizeDelta = size;
            var img = go.AddComponent<Image>();
            img.color = new Color(0.23f, 0.45f, 0.85f);
            var btn = go.AddComponent<Button>();
            btn.targetGraphic = img;
            var txt = MakeText(go.transform, "Label", new Vector2(0.5f, 0.5f), Vector2.zero, size, 22, TextAnchor.MiddleCenter);
            txt.text = label;
            return btn;
        }
    }
}
