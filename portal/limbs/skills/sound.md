# AGENT BRIEF · build the SOUND limb

You are installing a **local music/audio generator** on this machine so that a web page
(chatagent.ca/portal/) can produce audio files on it. You have a shell. The human is not expected to
type anything.

## What "done" means (check every line before you answer)

1. An audio file was generated **by this machine**; `file` says WAV or MP3/FLAC, and it plays.
2. `curl http://127.0.0.1:8192/health` returns `"ok": true` and `"backend": "comfy"`.
3. `POST /generate` returns `audio/wav` (or the type your workflow writes), and it is not the stub.
4. The human has a restart command; a reboot does not need you.
5. You report: checkpoint used, seconds per 30 s of audio, VRAM used.

## 1 · Check the machine

```bash
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
df -h .        # need ~12 GB
```

8 GB VRAM runs ACE-Step 1.5 turbo one track at a time; 12–16 GB is comfortable. No NVIDIA card →
use the portal's API route for audio instead of installing this limb.

## 2 · Install ComfyUI (the engine)

Windows: <https://github.com/comfyanonymous/ComfyUI/releases> → `ComfyUI_windows_portable_nvidia.7z`,
extract (e.g. `E:\ComfyUI`), run `run_nvidia_gpu.bat` once. It listens on <http://127.0.0.1:8188>.
Linux/macOS: <https://github.com/comfyanonymous/ComfyUI> → clone + venv + `requirements.txt`.
Keep it running.

## 3 · Get the weights — ACE-Step 1.5 (picked for the licence: MIT weights, ComfyUI's most-used music model)

Two honest options; pick one, not both.

**A · all-in-one checkpoint (simplest, 10.03 GB)** — from
<https://huggingface.co/Comfy-Org/ace_step_1.5_ComfyUI_files>:
`checkpoints/ace_step_1.5_turbo_aio.safetensors` → `ComfyUI/models/checkpoints/`

**B · split files (lets you swap the LM)** — from <https://huggingface.co/ACE-Step/Ace-Step1.5>:
`acestep-v15-turbo/model.safetensors` → `ComfyUI/models/diffusion_models/`,
`acestep-5Hz-lm-1.7B/model.safetensors` → `ComfyUI/models/text_encoders/`,
`vae/diffusion_pytorch_model.safetensors` → `ComfyUI/models/vae/`,
`Qwen3-Embedding-0.6B/model.safetensors` → `ComfyUI/models/text_encoders/`.

Official repo: <https://huggingface.co/ACE-Step/Ace-Step1.5> · licence MIT. The **turbo** model is the
one a desktop should run.

## 4 · Build the workflow the bridge drives

1. In ComfyUI: **Workflow → Browse Templates → Audio → ACE-Step 1.5**.
2. Rename, with F2, exactly: the prompt/tags text node → `PROMPT`; seed → `SEED`;
   the duration/length control → `SECONDS`; the sampler steps → `STEPS`.
   Leave the lyrics box alone unless the human asked for vocals.
3. **Workflow → Export (API)** → save as `sound.json` beside `limb_server.py`.
4. Render one clip in ComfyUI's UI first. If the tags produce noise, try the template's default
   example before blaming the install.

## 5 · Start the bridge

```bash
python limb_server.py --limb sound --port 8192 --backend comfy --workflow sound.json
```

Bridge: <https://chatagent.ca/portal/limbs/limb_server.py> (plain Python 3.9+, stdlib only for this
path). Binds `127.0.0.1`, answers the browser's CORS and Local Network Access preflight.

## 6 · Prove it

```bash
curl -s http://127.0.0.1:8192/health
curl -s -X POST http://127.0.0.1:8192/generate -H "Content-Type: application/json" \
     -d '{"prompt":"warm jazz trio, brushed drums, upright bass, 90 bpm","seconds":20}' \
     -o test.wav -w "%{http_code} %{content_type}\n"
file test.wav
```

Then open <https://chatagent.ca/portal/limbs.html>, confirm the Sound row says **running**, and
generate one clip from the page — the page is what the human will actually use.

## 7 · Leave the human restartable

`START_SOUND_LIMB.bat` beside the bridge: ComfyUI, wait for 8188, then the bridge on 8192. Say the port
out loud in your summary.

## Pitfalls

- **WAV is the honest default.** If your workflow writes FLAC or MP3, the page still plays it, but say
  which format you shipped.
- **Length is a workflow input, not a guess.** If no node is titled `SECONDS`, the bridge cannot change
  duration and every clip comes back the same length — rename the node.
- **Turbo vs base.** The base model needs far more steps and time; on a consumer card it is the
  difference between 8 s and 3 minutes per clip. Use turbo unless asked otherwise.
- **Tags, not prose.** ACE-Step reads style tags (`lo-fi, tape hiss, 84 bpm`), not sentences.
- **Stub is not proof.** `"backend": "stub"` means the model is not installed.
