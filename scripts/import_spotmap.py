import argparse
import hashlib
import json
import os
import sys
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests


SPOTMAP_API = "https://spotmap.ru/api/v2"
SPOTLIST_API = os.environ.get("SPOTLIST_API", "https://spotlist.online/api/v1")

RUSSIAN_CITIES = [
    "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург",
    "Казань", "Нижний Новгород", "Челябинск", "Самара",
    "Уфа", "Ростов-на-Дону", "Краснодар", "Омск",
    "Воронеж", "Пермь", "Волгоград", "Саратов",
    "Тюмень", "Тольятти", "Барнаул", "Ижевск",
    "Ульяновск", "Иркутск", "Хабаровск", "Ярославль",
    "Владивосток", "Махачкала", "Томск", "Оренбург",
    "Кемерово", "Рязань", "Астрахань", "Набережные Челны",
    "Пенза", "Липецк", "Тула", "Киров",
    "Чебоксары", "Калининград", "Брянск", "Курск",
    "Иваново", "Магнитогорск", "Тверь", "Ставрополь",
    "Нижний Тагил", "Белгород", "Архангельск", "Владимир",
    "Смоленск", "Курган", "Чита", "Калуга",
    "Сочи", "Орёл", "Волжский", "Мурманск",
    "Подольск", "Якутск", "Тамбов", "Петрозаводск",
    "Новороссийск", "Кострома", "Химки", "Таганрог",
    "Стерлитамак", "Великий Новгород", "Йошкар-Ола",
    "Псков", "Балашиха", "Петропавловск-Камчатский",
    "Рыбинск", "Саранск", "Южно-Сахалинск", "Нижневартовск",
    "Сыктывкар", "Норильск", "Бийск", "Ангарск",
    "Благовещенск", "Старый Оскол", "Великие Луки",
    "Грозный", "Нальчик", "Владикавказ", "Майкоп",
    "Черкесск", "Элиста", "Абакан", "Кызыл",
    "Горно-Алтайск", "Биробиджан", "Нарьян-Мар",
    "Ханты-Мансийск", "Салехард", "Анадырь",
]

SPORT_TO_RIDE_TYPE = {
    "mtb": "cycling",
    "bmx": "bmx",
    "skateboarding": "skateboard",
    "scooter": "scooter",
    "rollerblading": "rollerblades",
    "longboard": "longboard",
}

CATEGORY_OVERRIDES = {
    "bikepark": "cycling",
    "dirt": "bmx",
    "4x": "cycling",
    "downhill": "cycling",
    "xc": "cycling",
    "enduro": "cycling",
    "freeride": "cycling",
    "trail": "cycling",
    "slopestyle": "cycling",
    "pump_track": "other",
    "skatepark": "skateboard",
    "street": "skateboard",
    "bowl": "skateboard",
    "vert": "skateboard",
    "miniramp": "skateboard",
    "flatland": "bmx",
}

session = requests.Session()
session.headers.update({"User-Agent": "SpotList-Import/1.0"})


def fetch_all_spots():
    resp = session.get(f"{SPOTMAP_API}/spots", timeout=30)
    resp.raise_for_status()
    return resp.json()


def fetch_spot_detail(spot_id: int) -> dict | None:
    try:
        resp = session.get(f"{SPOTMAP_API}/spots/{spot_id}", timeout=15)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"  [WARN] Failed to fetch detail for spot {spot_id}: {e}")
        return None


def in_russian_city(spot: dict) -> bool:
    name = (spot.get("name") or "").lower()
    for city in RUSSIAN_CITIES:
        if city.lower() in name:
            return True
    return False


def determine_city(spot: dict) -> str:
    name = spot.get("name") or ""
    for city in RUSSIAN_CITIES:
        if city.lower() in name.lower():
            return city
    return "Россия"


def map_ride_types(spot: dict, detail: dict | None) -> list[str]:
    ride_types = set()
    detail_sports = (detail or {}).get("sports") or []
    detail_categories = (detail or {}).get("categories") or []
    raw = spot.get("sports") or spot.get("categories") or []

    all_names = set()
    for s in detail_sports:
        name = (s.get("slug") or s.get("name", "")).lower()
        all_names.add(name)
    for c in detail_categories:
        if isinstance(c, dict):
            name = (c.get("slug") or c.get("name", "")).lower()
        else:
            name = str(c).lower()
        all_names.add(name)
    for c in raw:
        if isinstance(c, dict):
            name = (c.get("slug") or c.get("name", "")).lower()
        else:
            name = str(c).lower()
        all_names.add(name)

    for name in all_names:
        if name in CATEGORY_OVERRIDES:
            ride_types.add(CATEGORY_OVERRIDES[name])
        elif name in SPORT_TO_RIDE_TYPE:
            ride_types.add(SPORT_TO_RIDE_TYPE[name])

    if not ride_types:
        ride_types.add("skateboard")

    return list(ride_types)


def download_and_upload_image(
    image_url: str, spot_id: int, token: str
) -> str | None:
    try:
        if not image_url.startswith("http"):
            image_url = f"https://spotmap.ru{image_url}"
        resp = session.get(image_url, timeout=30)
        resp.raise_for_status()
        ext = image_url.rsplit(".", 1)[-1].split("?")[0] if "." in image_url else "jpg"
        files = {
            "file": (
                f"spotmap_{spot_id}.{ext}",
                resp.content,
                f"image/{ext}",
            )
        }
        headers = {"Authorization": f"Bearer {token}"}
        upload_resp = requests.post(
            f"{SPOTLIST_API}/uploads", files=files, headers=headers, timeout=60
        )
        if upload_resp.status_code == 401:
            print("  [ERR] Upload auth failed (token invalid or expired)")
            return None
        upload_resp.raise_for_status()
        return upload_resp.json().get("url")
    except Exception as e:
        print(f"  [WARN] Failed to download/upload image for spot {spot_id}: {e}")
        return None


def spot_exists(name: str, lat: float, lon: float, token: str) -> bool:
    """Check if a spot with this name and approximate coordinates already exists."""
    try:
        resp = session.get(
            f"{SPOTLIST_API}/spots",
            params={"city": "", "page": 1, "page_size": 50},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        spots = data.get("spots") or data if isinstance(data, list) else []
        for s in spots:
            if (
                s.get("name", "").strip().lower() == name.strip().lower()
                and abs(float(s.get("latitude", 0)) - lat) < 0.01
                and abs(float(s.get("longitude", 0)) - lon) < 0.01
            ):
                return True
    except Exception:
        pass
    return False


def create_spot_in_spotlist(
    name: str,
    lat: float,
    lon: float,
    city: str,
    description: str | None,
    ride_types: list[str],
    media_urls: list[str],
    token: str,
) -> bool:
    payload = {
        "name": name,
        "latitude": lat,
        "longitude": lon,
        "city": city,
        "category": "street",
        "ride_types": ride_types,
        "status": "approved",
    }
    if description and description.strip():
        import re
        clean = re.sub(r"<[^>]+>", "", description).strip()[:1000]
        if clean:
            payload["description"] = clean
    if media_urls:
        payload["media"] = media_urls
    if media_urls:
        payload["screenshot"] = media_urls[0]

    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        resp = session.post(
            f"{SPOTLIST_API}/spots", json=payload, headers=headers, timeout=30
        )
        if resp.status_code == 401:
            print("  [ERR] Auth failed — token invalid or expired")
            return False
        if resp.status_code == 201:
            return True
        print(f"  [WARN] Create failed ({resp.status_code}): {resp.text[:200]}")
        return False
    except Exception as e:
        print(f"  [ERR] Request failed: {e}")
        return False


def process_spot(spot: dict, token: str, import_stats: dict) -> None:
    spot_id = spot["id"]
    name = spot.get("name", "")
    lat = float(spot.get("latitude", 0))
    lon = float(spot.get("longitude", 0))
    city = determine_city(spot)

    print(f"\n[{import_stats['processed'] + 1}] {name} ({city})")

    detail = fetch_spot_detail(spot_id)
    time.sleep(0.5)

    ride_types = map_ride_types(spot, detail)

    if spot_exists(name, lat, lon, token):
        print(f"  -> Skipped (duplicate)")
        import_stats["skipped"] += 1
        import_stats["processed"] += 1
        return

    media_urls = []
    if detail:
        first_image = detail.get("first_image")
        if first_image:
            url = download_and_upload_image(first_image, spot_id, token)
            if url:
                media_urls.append(url)
                if not url.startswith("http"):
                    url = f"{SPOTLIST_API}{url}"
                print(f"  -> Image uploaded")

    description = (detail or {}).get("description") if detail else None

    ok = create_spot_in_spotlist(
        name, lat, lon, city, description, ride_types, media_urls, token
    )
    if ok:
        import_stats["imported"] += 1
        print(f"  -> Imported (ride_types: {ride_types})")
    else:
        import_stats["failed"] += 1

    import_stats["processed"] += 1


def main():
    parser = argparse.ArgumentParser(description="Import spots from spotmap.ru")
    parser.add_argument(
        "--token",
        required=True,
        help="Bearer token for SpotList API (get from localStorage after login)",
    )
    parser.add_argument(
        "--workers", type=int, default=3, help="Number of parallel workers (default: 3)"
    )
    args = parser.parse_args()

    print("Fetching all spots from spotmap.ru...")
    all_spots = fetch_all_spots()
    print(f"Total spots: {len(all_spots)}")

    spots_to_import = [s for s in all_spots if in_russian_city(s)]
    print(f"Spots in Russian cities: {len(spots_to_import)}")

    if not spots_to_import:
        print("No spots found for Russian cities. Falling back to all spots.")
        spots_to_import = all_spots[:500]

    import_stats = {"processed": 0, "imported": 0, "skipped": 0, "failed": 0}
    start_time = time.time()

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = []
        for spot in spots_to_import:
            future = executor.submit(process_spot, spot, args.token, import_stats)
            futures.append(future)
            time.sleep(0.3)

        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                print(f"  [ERR] Worker failed: {e}")
                import_stats["failed"] += 1
                import_stats["processed"] += 1

    elapsed = time.time() - start_time
    print("\n" + "=" * 50)
    print("IMPORT COMPLETE")
    print(f"  Processed: {import_stats['processed']}")
    print(f"  Imported:  {import_stats['imported']}")
    print(f"  Skipped:   {import_stats['skipped']}")
    print(f"  Failed:    {import_stats['failed']}")
    print(f"  Time:      {elapsed:.0f}s ({elapsed/60:.1f}min)")
    print("=" * 50)


if __name__ == "__main__":
    main()
