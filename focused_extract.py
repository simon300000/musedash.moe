#!/bin/sh
"exec" "$(dirname $0)/.venv/bin/python3" "$0" "$@"
"""
Focused extraction of specific Muse Dash assets.
Extracts:
  - api/albums/       Album config TextAssets → JSON
  - api/extra/        Character & elfin config TextAssets → JSON
  - covers-raw/       Song cover Texture2D/Sprites → PNG
Then converts:
  - covers-raw/*.png  → src/covers/*.webp (cwebp -q 80)

Always uses parallel extraction (ThreadPoolExecutor).
"""

import os
import re
import json
import argparse
import subprocess
import threading
from pathlib import Path
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed

from UnityPy import AssetsManager

LANGS = {'ChineseS', 'ChineseT', 'English', 'Japanese', 'Korean'}

# Regex patterns for album TextAsset names
ALBUM_NAME_PATTERNS = [
    re.compile(rf'^ALBUM\d+(_({"|".join(LANGS)}))?$'),
    re.compile(rf'^albums(_({"|".join(LANGS)}))?$'),
]

# Regex patterns for character & elfin TextAsset names (lang suffix required)
EXTRA_NAME_PATTERNS = [
    re.compile(rf'^character_({"|".join(LANGS)})$'),
    re.compile(rf'^elfin_({"|".join(LANGS)})$'),
]


def match_album_name(name: str) -> bool:
    """Check if a TextAsset name is an album config."""
    return any(p.match(name) for p in ALBUM_NAME_PATTERNS)


def match_extra_name(name: str) -> bool:
    """Check if a TextAsset name is a character or elfin config."""
    return any(p.match(name) for p in EXTRA_NAME_PATTERNS)


def match_json_name(name: str) -> bool:
    """Check if a TextAsset name matches any target JSON pattern."""
    return match_album_name(name) or match_extra_name(name)


def is_cover_name(name: str) -> bool:
    """Check if a Texture2D/Sprite name is a song cover image."""
    return '_cover' in name


def sanitize_filename(name: str) -> str:
    if not name:
        return 'unnamed'
    for ch in '<>:"/\\|?*':
        name = name.replace(ch, '_')
    return name.strip().strip('.') or 'unnamed'


def extract_texture(tex, out_path: Path) -> bool:
    try:
        img = tex.image
        if img is None:
            return False
        out_path.parent.mkdir(parents=True, exist_ok=True)
        img.save(str(out_path))
        return True
    except IsADirectoryError:
        return False
    except Exception:
        return False


def extract_text_asset(ta, obj, out_path: Path) -> bool:
    try:
        data = ta.m_Script
        out_path.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(data, str):
            if any(0xD800 <= ord(c) <= 0xDFFF for c in data):
                raw = obj.get_raw_data()
                if raw is not None:
                    out_path.write_bytes(raw)
                    return True
                data = data.encode('utf-8', errors='replace').decode('utf-8')
            out_path.write_text(data, encoding='utf-8')
        elif isinstance(data, bytes):
            out_path.write_bytes(data)
        return True
    except Exception:
        return False


def process_bundle(bundle_path, album_dir, extra_dir, cover_dir,
                   seen_album, seen_extra, seen_cover, seen_lock):
    """Process a single bundle. Thread-safe via seen_lock for name dedup."""
    stats = defaultdict(int)
    bundle_name = bundle_path.stem

    try:
        am = AssetsManager(str(bundle_path))
    except Exception:
        stats['errors'] += 1
        return stats, bundle_path.name

    prefix = bundle_name.split('_assets_')[0] if '_assets_' in bundle_name else bundle_name.split('_')[0]
    is_config = prefix.startswith('config_')
    is_song_or_cover = prefix.startswith('song_') or prefix.startswith('covercommon')

    for asset in am.assets:
        for obj in asset.objects.values():
            try:
                data = obj.read()
            except Exception:
                continue

            t = type(data).__name__
            name = sanitize_filename(getattr(data, 'm_Name', ''))

            if t == 'TextAsset' and is_config and match_json_name(name):
                if match_album_name(name):
                    cat = 'album'
                    with seen_lock:
                        seen_album[name] += 1
                        cnt = seen_album[name]
                    fname = f"{name}_{cnt}.json" if cnt > 1 else f"{name}.json"
                    out = album_dir / fname
                else:
                    cat = 'extra'
                    with seen_lock:
                        seen_extra[name] += 1
                        cnt = seen_extra[name]
                    fname = f"{name}_{cnt}.json" if cnt > 1 else f"{name}.json"
                    out = extra_dir / fname

                if extract_text_asset(data, obj, out):
                    stats[cat] += 1

            elif t == 'Texture2D' and is_song_or_cover and is_cover_name(name):
                with seen_lock:
                    seen_cover[name] += 1
                    cnt = seen_cover[name]
                fname = f"{name}_{cnt}.png" if cnt > 1 else f"{name}.png"
                out = cover_dir / fname
                if extract_texture(data, out):
                    stats['covers'] += 1

    return stats, bundle_path.name


def convert_one_webp(png_path: Path, webp_dir: Path, quality: int = 75) -> bool:
    """Convert a single PNG to WebP using cwebp."""
    webp_path = webp_dir / f'{png_path.stem}.webp'
    try:
        subprocess.run(
            ['cwebp', '-q', str(quality), '-sharp_yuv', '-mt', '-metadata', 'none',
             str(png_path), '-o', str(webp_path)],
            capture_output=True, check=True
        )
        return True
    except Exception:
        return False


def convert_covers(covers_raw_dir: Path, webp_dir: Path,
                   workers: int, quality: int = 75, dry_run: bool = False):
    """Convert all PNGs in covers-raw/ to WebP in src/covers/."""
    pngs = sorted(covers_raw_dir.glob('*.png'))
    if not pngs:
        print("No PNGs found in covers-raw/ to convert.")
        return 0

    print(f"\nConverting {len(pngs)} PNGs → WebP (q={quality}) with cwebp ({workers} workers)")
    print(f"  {covers_raw_dir}/ → {webp_dir}/")
    if dry_run:
        print("[DRY RUN] No files will be written")
        return len(pngs)

    webp_dir.mkdir(parents=True, exist_ok=True)
    converted = 0
    completed = 0

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(convert_one_webp, p, webp_dir, quality): p.name
            for p in pngs
        }
        for future in as_completed(futures):
            completed += 1
            if future.result():
                converted += 1
            if completed % 200 == 0:
                print(f"  WebP: {completed}/{len(pngs)} converted")

    print(f"  WebP done: {converted}/{len(pngs)} converted")
    return converted


def main():
    parser = argparse.ArgumentParser(
        description='Focused extraction of Muse Dash album/character/elfin JSONs and song covers'
    )
    parser.add_argument('--bundle-dir', default='StreamingAssets/aa/StandaloneOSX')
    parser.add_argument('--output', '-o', default='.',
                        help='Base output directory (default: current dir = project root)')
    parser.add_argument('--workers', '-w', type=int, default=0,
                        help='Number of workers (default: 0 = CPU count)')
    parser.add_argument('--dry-run', action='store_true',
                        help='List what would be extracted without writing files')
    parser.add_argument('--skip-webp', action='store_true',
                        help='Skip WebP conversion after extraction')
    parser.add_argument('--webp-quality', type=int, default=75,
                        help='WebP quality (default: 75)')
    args = parser.parse_args()

    bundle_dir = Path(args.bundle_dir)
    base_out = Path(args.output)
    album_dir = base_out / 'api' / 'albums'
    extra_dir = base_out / 'api' / 'extra'
    cover_dir = base_out / 'covers-raw'
    workers = args.workers if args.workers > 0 else os.cpu_count() or 4

    bundles = sorted(os.listdir(bundle_dir))
    # Only scan config_, song_, and covercommon bundles
    bundles = [b for b in bundles if b.startswith(('config_', 'song_', 'covercommon_'))]
    total = len(bundles)

    print(f"Processing {total} bundles from {bundle_dir} ({workers} workers)")
    print(f"  Albums     → {album_dir}/")
    print(f"  Characters & elfin → {extra_dir}/")
    print(f"  Covers     → {cover_dir}/")
    if args.dry_run:
        print("[DRY RUN] No files will be written\n")

    if not args.dry_run:
        album_dir.mkdir(parents=True, exist_ok=True)
        extra_dir.mkdir(parents=True, exist_ok=True)
        cover_dir.mkdir(parents=True, exist_ok=True)

    seen_album = defaultdict(int)
    seen_extra = defaultdict(int)
    seen_cover = defaultdict(int)
    seen_lock = threading.Lock()
    print_lock = threading.Lock()
    stats = defaultdict(int)
    completed = 0
    bundle_count = 0

    bundle_paths = [bundle_dir / b for b in bundles]

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(
                process_bundle, bp, album_dir, extra_dir, cover_dir,
                seen_album, seen_extra, seen_cover, seen_lock
            ): bp.name
            for bp in bundle_paths
        }

        for future in as_completed(futures):
            bstats, bname = future.result()
            completed += 1

            for k, v in bstats.items():
                stats[k] += v
            if any(v > 0 for v in bstats.values()):
                bundle_count += 1

            with print_lock:
                items = ', '.join(f"{k}: {v}" for k, v in sorted(bstats.items()) if v > 0)
                if items:
                    print(f"[{completed}/{total}] {bname[:70]}: {items}")
                if completed % 200 == 0:
                    print(f"  --- {completed}/{total} | "
                          f"album: {stats['album']}, extra: {stats['extra']}, covers: {stats['covers']} ---")

    mode = "Would extract" if args.dry_run else "Extracted"
    print(f"\nDone! {mode} from {bundle_count}/{total} bundles with content:")
    print(f"  Albums (api/albums/):          {stats['album']}")
    print(f"  Characters & elfin (api/extra/): {stats['extra']}")
    print(f"  Covers (covers-raw/):           {stats['covers']}")
    print(f"  Errors:                         {stats['errors']}")
    if not args.dry_run:
        print(f"\nOutput root: {base_out.resolve()}")

    # Convert PNG covers to WebP
    if not args.skip_webp and (args.dry_run or stats['covers'] > 0):
        convert_covers(
            cover_dir,
            base_out / 'src' / 'covers',
            workers=workers,
            quality=args.webp_quality,
            dry_run=args.dry_run,
        )


if __name__ == '__main__':
    main()
