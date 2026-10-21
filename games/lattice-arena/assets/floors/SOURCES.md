# New arena floor mats — sources and licence

The ten mats added in the 2026-10 mat pass are composed from **Poly Haven** textures.
Poly Haven releases every asset (HDRIs, textures, models) as **CC0 / public domain** —
no attribution required, commercial use allowed (<https://polyhaven.com/license>).
Credit is given here anyway.

The composed mats are the only files that ship; the source textures are cached outside the
repo (`tools/gen_arena_mats.py --fetch` restores them).

| mat | ground source (Poly Haven) | licence | diff map |
| --- | --- | --- | --- |
| `basalt.jpg` | [`aerial_rocks_02`](https://polyhaven.com/a/aerial_rocks_02) | CC0 | 2k Diffuse |
| `nightrun.jpg` | [`asphalt_02`](https://polyhaven.com/a/asphalt_02) | CC0 | 2k Diffuse |
| `glacier.jpg` | [`snow_02`](https://polyhaven.com/a/snow_02) | CC0 | 2k Diffuse |
| `gantry.jpg` | [`metal_plate`](https://polyhaven.com/a/metal_plate) | CC0 | 2k Diffuse |
| `granite.jpg` | [`granite_tile`](https://polyhaven.com/a/granite_tile) | CC0 | 2k Diffuse |
| `rustbelt.jpg` | [`rust_coarse_01`](https://polyhaven.com/a/rust_coarse_01) | CC0 | 2k Diffuse |
| `highland.jpg` | [`aerial_grass_rock`](https://polyhaven.com/a/aerial_grass_rock) | CC0 | 2k Diffuse |
| `marble.jpg` | [`marble_01`](https://polyhaven.com/a/marble_01) | CC0 | 2k Diffuse |
| `flagstone.jpg` | [`stone_tiles_02`](https://polyhaven.com/a/stone_tiles_02) | CC0 | 2k Diffuse |
| `tideline.jpg` | [`aerial_beach_01`](https://polyhaven.com/a/aerial_beach_01) | CC0 | 2k Diffuse |

Ring, medallion and wordmark are drawn by `tools/gen_arena_mats.py` (Arial Black wordmark, the house octagon/ring geometry measured off the original set).
