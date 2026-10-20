# AGENT BRIEF · build the VIDEO limb

You are installing a **local text/image-to-video generator** on this machine so that a web page
(chatagent.ca/portal/) can produce short clips on it. You have a shell. The human is not expected to
type anything.

## What "done" means (check every line before you answer)

1. A clip was generated **by this machine**; `file` says MP4/WebM and it plays with sound or without.
2. `curl http://127.0.0.1:8193/health` returns `"ok": true` and `"backend": "comfy"`.
3. `POST /generate` returns `video/mp4` (or webm), and it is not the stub.
4. The human has a restart command; a reboot does not need you.
5. You report: model + quant used, seconds per 5 s clip at 720p, VRAM peak, and the frame budget.

Set the expectation out loud: **a good consumer card makes seconds of video in minutes.** Wan 2.2
TI2V-5B at 720p/5 s is typically 3–10 minutes on 12–16 GB. That is the model working, not hanging.

## 1 · Check the machine

```bash
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
df -h .            # need ~20 GB
ffmpeg -version | head -1
```

12 GB VRAM is the honest floor for 720p; 16–24 GB is comfortable. 8 GB → 480p and short clips, or do
not install it and use the portal's API route instead. `ffmpeg` must exist for playback and for
ComfyUI's video save node.

## 2 · Install ComfyUI (the engine)

Windows: <https://github.com/comfyanonymous/ComfyUI/releases> → `ComfyUI_windows_portable_nvidia.7z`,
extract (e.g. `E:\ComfyUI`), run `run_nvidia_gpu.bat` once. Listens on <http://127.0.0.1:8188>.
Linux/macOS: <https://github.com/comfyanonymous/ComfyUI> → clone + venv + `requirements.txt`.

ComfyUI's video nodes need `ffmpeg` on PATH; install it before the first render
(<https://ffmpeg.org/download.html>, or `winget install Gyan.FFmpeg`).

## 3 · Get the weights — Wan 2.2 TI2V-5B (picked: Apache-2.0, 720p, and 3.8 GB at Q5 instead of 34 GB)

**Desktop path (Q5 GGUF, ~18 GB total)** — model from
<https://huggingface.co/QuantStack/Wan2.2-TI2V-5B-GGUF>:
`Wan2.2-TI2V-5B-Q5_K_M.gguf` (3.8 GB) → `ComfyUI/models/unet/`
plus the loader node from <https://github.com/city96/ComfyUI-GGUF>.

Text encoder + VAE from <https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged> (or the official
<https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B>):
`split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors` (~6–11 GB depending on dtype) →
`ComfyUI/models/text_encoders/`, and
`split_files/vae/wan2.2_vae.safetensors` → `ComfyUI/models/vae/`.
Exact filenames: load the template in step 4, take the *missing models* dialog's name, download that.

**Full bf16 path** (24 GB+ cards): the official repo, 34 GB, unquantized.

## 4 · Build the workflow the bridge drives

1. In ComfyUI: **Workflow → Browse Templates → Video → Wan 2.2 TI2V 5B** (text-to-video first; add the
   image input only if the human asked for image-to-video).
2. Rename with F2, exactly: prompt text node → `PROMPT`; seed → `SEED`; width → `WIDTH`;
   height → `HEIGHT`; the length/frame-count control → `SECONDS`; sampler steps → `STEPS`.
3. **Workflow → Export (API)** → save as `video.json` beside `limb_server.py`.
4. Render one 2-second clip in ComfyUI's UI. Confirm the output has a playable container. Do not
   continue until that works — minutes per attempt make debugging through the bridge expensive.

## 5 · Start the bridge

```bash
python limb_server.py --limb video --port 8193 --backend comfy --workflow video.json --timeout 1800
```

Bridge: <https://chatagent.ca/portal/limbs/limb_server.py> (plain Python 3.9+, stdlib only for this
path). Binds `127.0.0.1`; answers the browser's CORS + Local Network Access preflight. `--timeout`
must exceed a worst-case clip or the bridge gives up while ComfyUI is still rendering.

## 6 · Prove it

```bash
curl -s http://127.0.0.1:8193/health
curl -s -X POST http://127.0.0.1:8193/generate -H "Content-Type: application/json" \
     -d '{"prompt":"slow waves at dusk, low camera, 24fps","seconds":3}' \
     -o test.mp4 -w "%{http_code} %{content_type}\n"
file test.mp4
```

Then open <https://chatagent.ca/portal/limbs.html>, confirm the Video row says **running**, and make
one clip from the page. The page is what the human will use; a curl-only proof is not done.

## 7 · Leave the human restartable

`START_VIDEO_LIMB.bat` beside the bridge: ComfyUI, wait for 8188, then the bridge on 8193 with the
timeout flag. Say the port and the expected minutes per clip in your summary.

## Pitfalls

- **Timeouts are the number one failure.** The browser waits, the bridge polls; if `--timeout` is short
  you will see `the engine did not finish within Ns` while ComfyUI is still working. Set it to 1800.
- **Frame-count node, not seconds.** If the workflow controls length by frames, title that node
  `SECONDS` and let the workflow's own maths convert; otherwise every clip is the template default.
- **Container mismatch.** Some saves write WebP/APNG; the portal plays MP4/WebM. Add the video-save node
  ComfyUI ships, not an animated-image save, and confirm `file test.mp4` says ISO Media/MP4.
- **VRAM cliff.** 720p at 121 frames can OOM where 480p at 49 frames does not. Start small, then scale
  once it works, and state the resolution you tested.
- **Stub is not proof.** `"backend": "stub"` means the real model never ran.
