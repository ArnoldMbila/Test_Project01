using System;
using System.Collections.Generic;
using BibleArcade.Core;
using BibleArcade.MiniGames;
using UnityEngine;
using UnityEngine.UI;

namespace BibleArcade.UI
{
    /// <summary>
    /// THE one component you need: drop ArcadeLauncher on an empty GameObject in
    /// an empty scene and press Play. It boots GameServices, shows the arcade
    /// menu (choose level + mini-game), starts the chosen game, and offers a
    /// "Zur Spielhalle" button to come back. Everything else is created in code.
    /// </summary>
    public class ArcadeLauncher : MonoBehaviour
    {
        private struct GameDef
        {
            public string Label;
            public string Description;
            public Type Component;

            public GameDef(string label, string description, Type component)
            {
                Label = label; Description = description; Component = component;
            }
        }

        private static readonly GameDef[] Games =
        {
            new GameDef("Wortlauf",          "3D-Runner: lauf durch das richtige Tor!", typeof(GateRunnerGame)),
            new GameDef("Gleichnis-Paare",   "Finde die zusammengehörenden Paare.",     typeof(PairMatchGame)),
            new GameDef("Wächter des Wissens","Besiege den Wächter mit Wissen!",        typeof(BossBattleGame)),
            new GameDef("Brücke der Zeitalter","Baue die Brücke in der richtigen Reihenfolge.", typeof(OrderPuzzleGame)),
            new GameDef("Karten der Weisheit","Spiele die richtige Antwort-Karte.",     typeof(CardDuelGame)),
            new GameDef("Takt der Wahrheit", "Antworte im Takt für Bonus-XP!",          typeof(RhythmQuizGame)),
            new GameDef("Lauf der Boten",    "Gewinne das Rennen gegen den Rivalen.",   typeof(RelayRaceGame)),
            new GameDef("Stadt des Lichts",  "Baue deine Stadt mit verdienten Münzen.", typeof(KingdomBuilderGame))
        };

        private GameObject _menuRoot;
        private GameObject _activeGame;
        private string _selectedCategory = "grundstufe";
        private readonly List<Text> _categoryLabels = new List<Text>();

        private void Start()
        {
            var _ = GameServices.Instance; // boot all core systems
            ShowMenu();
        }

        public void ShowMenu()
        {
            if (_activeGame != null)
            {
                Destroy(_activeGame);
                _activeGame = null;
            }
            HUDController.SetVisible(false);
            BuildMenu();
        }

        private void BuildMenu()
        {
            if (_menuRoot != null) Destroy(_menuRoot);
            _menuRoot = new GameObject("ArcadeMenu");
            _menuRoot.transform.SetParent(transform);

            var canvasGo = new GameObject("MenuCanvas");
            canvasGo.transform.SetParent(_menuRoot.transform);
            var canvas = canvasGo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 50;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280, 720);
            canvasGo.AddComponent<GraphicRaycaster>();

            HUDController.MakePanel(canvas.transform, "Backdrop", new Vector2(0.5f, 0.5f),
                Vector2.zero, new Vector2(1280, 720), out var backdrop);
            backdrop.color = new Color(0.07f, 0.09f, 0.16f, 1f);

            var title = HUDController.MakeText(canvas.transform, "Title", new Vector2(0.5f, 1f),
                new Vector2(0, -40), new Vector2(900, 60), 38, TextAnchor.MiddleCenter);
            title.text = "Arcade der Heiligen Schrift";
            title.fontStyle = FontStyle.Bold;

            // category row
            string[] categories = { "grundstufe", "mittelstufe", "oberstufe" };
            string[] catLabels = { "Grundstufe", "Mittelstufe", "Oberstufe" };
            _categoryLabels.Clear();
            for (int i = 0; i < categories.Length; i++)
            {
                string cat = categories[i];
                var btn = HUDController.MakeButton(canvas.transform, catLabels[i],
                    new Vector2(0.5f, 1f), new Vector2(-220 + i * 220, -110), new Vector2(200, 48));
                var label = btn.GetComponentInChildren<Text>();
                _categoryLabels.Add(label);
                btn.onClick.AddListener(() =>
                {
                    GameServices.Instance.Audio.PlayClick();
                    _selectedCategory = cat;
                    RefreshCategoryHighlight();
                });
            }
            RefreshCategoryHighlight();

            // game grid: 2 columns x 4 rows
            for (int i = 0; i < Games.Length; i++)
            {
                int idx = i;
                int col = i % 2, row = i / 2;
                var btn = HUDController.MakeButton(canvas.transform, Games[i].Label,
                    new Vector2(0.5f, 1f), new Vector2(-250 + col * 500, -200 - row * 100), new Vector2(460, 80));
                btn.image.color = new Color(0.16f, 0.22f, 0.38f);
                var label = btn.GetComponentInChildren<Text>();
                label.text = $"{Games[i].Label}\n<size=16>{Games[i].Description}</size>";
                label.supportRichText = true;
                btn.onClick.AddListener(() => LaunchGame(idx));
            }

            // stats footer
            var profile = GameServices.Instance.Save.Profile;
            var stats = HUDController.MakeText(canvas.transform, "Stats", new Vector2(0.5f, 0f),
                new Vector2(0, 30), new Vector2(900, 40), 20, TextAnchor.MiddleCenter);
            stats.text = $"Lv {ProgressionSystem.LevelForXp(profile.xp)}  ·  {profile.xp} XP  ·  " +
                         $"{profile.coins} Münzen  ·  Tagesserie: {profile.dailyStreak} 🔥";
        }

        private void RefreshCategoryHighlight()
        {
            string[] categories = { "grundstufe", "mittelstufe", "oberstufe" };
            for (int i = 0; i < _categoryLabels.Count; i++)
            {
                var btnImage = _categoryLabels[i].transform.parent.GetComponent<Image>();
                btnImage.color = categories[i] == _selectedCategory
                    ? new Color(0.95f, 0.65f, 0.15f)
                    : new Color(0.23f, 0.45f, 0.85f);
            }
        }

        private void LaunchGame(int index)
        {
            GameServices.Instance.Audio.PlayClick();
            Destroy(_menuRoot);
            _menuRoot = null;
            HUDController.SetVisible(true);

            _activeGame = new GameObject("MiniGame_" + Games[index].Label);
            var game = (MiniGameBase)_activeGame.AddComponent(Games[index].Component);
            game.Configure(_selectedCategory);

            // back-to-arcade button stays available during play
            var backCanvasGo = new GameObject("BackCanvas");
            backCanvasGo.transform.SetParent(_activeGame.transform);
            var canvas = backCanvasGo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 200;
            backCanvasGo.AddComponent<GraphicRaycaster>();
            var back = HUDController.MakeButton(canvas.transform, "← Spielhalle",
                new Vector2(1f, 0f), new Vector2(-110, 35), new Vector2(180, 44));
            back.image.color = new Color(0.3f, 0.3f, 0.4f, 0.9f);
            back.onClick.AddListener(ShowMenu);
        }
    }
}
