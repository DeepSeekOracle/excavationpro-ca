# AGENT BRIEF · build the IMAGE limb

You are installing a **local image engine** on this machine so that a web page (chatagent.ca/portal/)
can make pictures on it. You have a shell. The human is not expected to type anything.

## What "done" means (check every line before you answer)

1. A picture was generated **by this machine** and written to disk; `file` says PNG or JPEG.
2. `curl http://127.0.0.1:8191/health` returns JSON with `"ok": true` and `"backend": "comfy"`.
3. `curl -X POST ...` to `/generate` returns `image/png` (or jpeg) and it is not the stub.
4. The human has the exact command to restart the bridge after a reboot.
5. You report: model file(s) used, seconds per image at the size you tested, VRAM used.

If any line fails, say which one and stop. Do not report success on a stub.

## 1 · Check the machine before downloading 20 GB

```bash
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader   # VRAM
df -h .                                                          # free disk (need ~25 GB)
ffmpeg -version | head -1                                        # optional, only for video
```

Guide: 12 GB VRAM or more → the int8 text encoder + turbo bf16 model below. 8 GB → the GGUF Q5/Q6
model plus the GGUF text encoder, and expect one picture at a time. No NVIDIA card → use the portal's
API routes instead of this limb; do not install it.

## 2 · Install ComfyUI (the engine)

Windows: the official portable package is the least fragile path —
<https://github.com/comfyanonymous/ComfyUI/releases> → `ComfyUI_windows_portable_nvidia.7z`
(extract to e.g. `E:\ComfyUI`; it carries its own Python).
Linux/macOS: <https://github.com/comfyanonymous/ComfyUI> → clone, `python -m venv .venv`, install
`requirements.txt`.

Start it once to create the folder tree: `ComfyUI_windows_portable\run_nvidia_gpu.bat`.
It listens on <http://127.0.0.1:8188>. Leave it running.

## 3 · Get the weights — Qwen-Image 2.1 (picked: 11.4M pulls, best-in-class text rendering)

ComfyUI's own file layout (all from <https://huggingface.co/Comfy-Org/Qwen-Image-2.1>):

| file | goes in | size |
|---|---|---|
| `diffusion_models/qwen_image_2.1_turbo_bf16.safetensors` | `ComfyUI/models/diffusion_models/` | 14.2 GB |
| `text_encoders/qwen3vl_8b_int8_convrot.safetensors` | `ComfyUI/models/text_encoders/` | 9.35 GB |
| the Qwen-Image VAE from the same repo (`vae/`) | `ComfyUI/models/vae/` | ~250 MB |

Low-VRAM alternative (<https://huggingface.co/unsloth/Qwen-Image-2.1-GGUF>):
`qwen-image-2.1-Q6_K_XL.gguf` (6.7 GB) or `qwen-image-2.1-Q5_K_M.gguf` (5.4 GB) into
`ComfyUI/models/unet/` **plus** the GGUF loader node from
<https://github.com/city96/ComfyUI-GGUF>.

Fastest honest way to place files: load the template in step 4 — ComfyUI shows a *missing models*
dialog naming the exact file and folder. Use that, then re-open the template.

Official diffusers weights (if you prefer `--backend diffusers`):
<https://huggingface.co/Qwen/Qwen-Image-2.1> (33 GB, bf16).

## 4 · Build the workflow the bridge drives

1. In ComfyUI: **Workflow → Browse Templates → Image → Qwen-Image 2.1** (pick the turbo variant).
2. Rename these nodes so the bridge can find them — select node, press F2, type the title exactly:
   the positive prompt text node → `PROMPT`; the seed control → `SEED`; width → `WIDTH`;
   height → `HEIGHT`; the sampler steps → `STEPS`.
3. **Workflow → Export (API)** — not "Save". Save as `image.json` next to `limb_server.py`.
4. Run it once in ComfyUI's own UI to confirm the model loads and a picture appears. Do not continue
   until that works — the bridge cannot fix a broken graph.

## 5 · Start the bridge (this is what the portal calls)

```bash
python limb_server.py --limb image --port 8191 --backend comfy --workflow image.json
```

`limb_server.py` is at <https://chatagent.ca/portal/limbs/limb_server.py> (Python 3.9+, no packages
for this backend). It binds `127.0.0.1` only and answers the browser's CORS + Local Network Access
preflight, which ComfyUI itself does not.

## 6 · Prove it, then prove it again with a real prompt

```bash
curl -s http://127.0.0.1:8191/health
curl -s -X POST http://127.0.0.1:8191/generate \
     -H "Content-Type: application/json" \
     -d '{"prompt":"a brass lantern on wet stone, night, 35mm"}' -o test.png -w "%{http_code} %{content_type}\n"
file test.png
```

Open <https://chatagent.ca/portal/limbs.html> (or the LOCAL LIMBS module on the portal) and confirm the
Image row says **running**, then generate one picture from the page. A page-generated picture and a
curl-generated picture must both work; the page is the one the human will use.

## 7 · Leave the human restartable

Write `START_IMAGE_LIMB.bat` next to the bridge containing the two commands (ComfyUI, then the bridge),
and tell them the port: 8191. A reboot must not need you.

## Pitfalls that cost the most time

- **Export (API) vs Save.** "Save" writes a UI graph with links and widgets; the bridge's `/prompt` call
  needs API format. If ComfyUI answers `{"error": ... "prompt"}` your JSON is the UI format.
- **Node titles.** The bridge matches `_meta.title` exactly (`PROMPT`, `SEED`, `WIDTH`, `HEIGHT`,
  `STEPS`). If no node is titled `PROMPT`, every image comes back identical.
- **Text encoder dtype.** bf16 text encoder + bf16 model wants ~24 GB; use the int8 encoder on 12 GB.
- **Port taken.** 8191 is the contract; if something else holds it, pass `--port` and use the same port
  in the portal URL — never move the portal's expectation silently.
- **Firewall prompts.** Accept only private-network access. The bridge must stay on `127.0.0.1`.
- **Stub is not proof.** `--backend stub` writes a gradient. If `/health` says `"backend": "stub"`,
  the model is not installed, whatever the picture looks like.
