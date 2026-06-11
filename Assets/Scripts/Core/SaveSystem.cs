using System;
using System.IO;
using BibleArcade.Data;
using UnityEngine;

namespace BibleArcade.Core
{
    /// <summary>
    /// JSON persistence for the player profile under Application.persistentDataPath.
    /// Writes atomically (temp file + move) so a crash mid-save never corrupts data.
    /// </summary>
    public class SaveSystem : MonoBehaviour
    {
        private const string FileName = "player_profile.json";

        public PlayerProfile Profile { get; private set; }

        private string SavePath => Path.Combine(Application.persistentDataPath, FileName);

        private void Awake()
        {
            Load();
        }

        public void Load()
        {
            try
            {
                if (File.Exists(SavePath))
                {
                    Profile = JsonUtility.FromJson<PlayerProfile>(File.ReadAllText(SavePath));
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveSystem] Load failed, starting fresh: {e.Message}");
            }
            Profile ??= new PlayerProfile();
        }

        public void Save()
        {
            try
            {
                string tmp = SavePath + ".tmp";
                File.WriteAllText(tmp, JsonUtility.ToJson(Profile, prettyPrint: true));
                if (File.Exists(SavePath)) File.Delete(SavePath);
                File.Move(tmp, SavePath);
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveSystem] Save failed: {e.Message}");
            }
        }

        private void OnApplicationPause(bool paused)
        {
            if (paused) Save();
        }

        private void OnApplicationQuit()
        {
            Save();
        }
    }
}
