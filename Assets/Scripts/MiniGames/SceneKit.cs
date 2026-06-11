using UnityEngine;

namespace BibleArcade.MiniGames
{
    /// <summary>
    /// Helpers every mini-game uses to build a playable 3D scene from primitives:
    /// camera/light/ground bootstrap, labeled answer blocks, world-space text.
    /// All placeholder visuals — replace with real models/materials later without
    /// touching game logic.
    /// </summary>
    public static class SceneKit
    {
        public static readonly Color[] OptionColors =
        {
            new Color(0.20f, 0.50f, 0.90f),
            new Color(0.90f, 0.55f, 0.15f),
            new Color(0.55f, 0.30f, 0.80f),
            new Color(0.15f, 0.70f, 0.55f)
        };

        public static Camera EnsureCamera(Vector3 pos, Vector3 euler)
        {
            var cam = Camera.main;
            if (cam == null)
            {
                var go = new GameObject("Main Camera") { tag = "MainCamera" };
                cam = go.AddComponent<Camera>();
                go.AddComponent<AudioListener>();
            }
            cam.transform.SetPositionAndRotation(pos, Quaternion.Euler(euler));
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.07f, 0.09f, 0.16f);
            return cam;
        }

        public static void EnsureLight()
        {
            if (Object.FindFirstObjectByType<Light>() != null) return;
            var go = new GameObject("Sun");
            var light = go.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.1f;
            go.transform.rotation = Quaternion.Euler(55f, -30f, 0f);
        }

        public static GameObject MakeGround(Transform parent, Vector3 center, Vector3 scale, Color color)
        {
            var ground = GameObject.CreatePrimitive(PrimitiveType.Cube);
            ground.name = "Ground";
            ground.transform.SetParent(parent);
            ground.transform.position = center;
            ground.transform.localScale = scale;
            Tint(ground, color);
            return ground;
        }

        /// <summary>Colored block with floating wrapped text above it; collider intact for clicks.</summary>
        public static GameObject MakeAnswerBlock(Transform parent, string text, Vector3 pos, Vector3 scale, Color color)
        {
            var block = GameObject.CreatePrimitive(PrimitiveType.Cube);
            block.name = "Answer";
            block.transform.SetParent(parent);
            block.transform.position = pos;
            block.transform.localScale = scale;
            Tint(block, color);
            MakeLabel(block.transform, text, new Vector3(0, 0.5f + 0.9f / Mathf.Max(scale.y, 0.01f), 0), 0.5f / Mathf.Max(scale.x, 0.01f));
            return block;
        }

        /// <summary>World-space TextMesh that always faces the camera.</summary>
        public static TextMesh MakeLabel(Transform parent, string text, Vector3 localPos, float scale = 0.5f)
        {
            var go = new GameObject("Label");
            go.transform.SetParent(parent, false);
            go.transform.localPosition = localPos;
            go.transform.localScale = Vector3.one * scale;
            var tm = go.AddComponent<TextMesh>();
            tm.text = Wrap(text, 26);
            tm.fontSize = 48;
            tm.characterSize = 0.1f;
            tm.anchor = TextAnchor.MiddleCenter;
            tm.alignment = TextAlignment.Center;
            tm.color = Color.white;
            go.AddComponent<FaceCamera>();
            return tm;
        }

        public static void Tint(GameObject go, Color color)
        {
            var r = go.GetComponent<Renderer>();
            if (r != null) r.material.color = color;
        }

        /// <summary>Returns the clicked collider this frame, or null.</summary>
        public static Collider PickOnClick(Camera cam)
        {
            if (!Input.GetMouseButtonDown(0)) return null;
            var ray = cam.ScreenPointToRay(Input.mousePosition);
            return Physics.Raycast(ray, out var hit, 500f) ? hit.collider : null;
        }

        public static string Wrap(string text, int maxLineLength)
        {
            if (string.IsNullOrEmpty(text) || text.Length <= maxLineLength) return text;
            var words = text.Split(' ');
            var sb = new System.Text.StringBuilder();
            int lineLen = 0;
            foreach (var w in words)
            {
                if (lineLen > 0 && lineLen + w.Length + 1 > maxLineLength)
                {
                    sb.Append('\n');
                    lineLen = 0;
                }
                else if (lineLen > 0)
                {
                    sb.Append(' ');
                    lineLen++;
                }
                sb.Append(w);
                lineLen += w.Length;
            }
            return sb.ToString();
        }
    }

    public class FaceCamera : MonoBehaviour
    {
        private void LateUpdate()
        {
            if (Camera.main != null)
                transform.rotation = Quaternion.LookRotation(transform.position - Camera.main.transform.position);
        }
    }
}
