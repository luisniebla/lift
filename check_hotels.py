#!/usr/bin/env python3
"""
Anime Expo 2026 Hotel Availability Checker

Checks the Passkey hotel block for availability between July 1-6, 2026.
Runs every 10 minutes and sends a desktop notification when rooms open up.
"""

import json
import re
import sys
import time
from datetime import datetime

import requests

EVENT_URL_PREFIX = "event/51165859/owner/6893"
BASE_URL = "https://book.passkey.com"
HOME_URL = f"{BASE_URL}/{EVENT_URL_PREFIX}/home"
GROUP_URL = f"{BASE_URL}/{EVENT_URL_PREFIX}/home/group"
SEARCH_URL = f"{BASE_URL}/{EVENT_URL_PREFIX}/rooms/find/hotels"
LIST_URL = f"{BASE_URL}/{EVENT_URL_PREFIX}/list/hotels"
BOOKING_URL = f"{BASE_URL}/{EVENT_URL_PREFIX}/list/hotels"

# Attendee group type ID
ATTENDEE_GROUP_TYPE_ID = "221020473"

CHECK_IN = "2026-07-01"
CHECK_OUT = "2026-07-06"
CHECK_INTERVAL_SECONDS = 600  # 10 minutes


def get_session():
    """Create a new session, visit the home page, and select attendee type."""
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    })

    # Step 1: Visit home page to get cookies and CSRF token
    resp = session.get(HOME_URL, allow_redirects=True)
    resp.raise_for_status()

    csrf_token = session.cookies.get("XSRF-TOKEN")
    if not csrf_token:
        raise RuntimeError("Could not get XSRF-TOKEN from cookies")

    session.headers.update({"X-XSRF-TOKEN": csrf_token})

    # Step 2: Select attendee type
    resp = session.post(
        GROUP_URL,
        data={
            "_csrf": csrf_token,
            "groupTypeId": ATTENDEE_GROUP_TYPE_ID,
            "accessCode": "",
        },
        allow_redirects=True,
    )
    resp.raise_for_status()

    # Update CSRF token if it changed
    new_csrf = session.cookies.get("XSRF-TOKEN")
    if new_csrf:
        session.headers.update({"X-XSRF-TOKEN": new_csrf})

    return session


def search_hotels(session):
    """Submit a search for July 1-6 and return the hotel data."""
    search_payload = {
        "multiHotelRoom": False,
        "hotelId": 0,
        "distanceEnd": 0,
        "maxGuests": 8,
        "hotelIds": [],
        "blockMap": {
            "blocks": [
                {
                    "hotelId": 0,
                    "blockId": 0,
                    "checkIn": CHECK_IN,
                    "checkOut": CHECK_OUT,
                    "numberOfGuests": 1,
                    "numberOfRooms": 1,
                    "numberOfChildren": 0,
                }
            ],
            "totalRooms": 1,
            "totalGuests": 1,
        },
        "minSlideRate": 0,
        "maxSlideRate": 0,
        "wlSearch": True,
        "showAll": False,
        "mod": False,
    }

    # Submit search
    resp = session.post(
        SEARCH_URL,
        json=search_payload,
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    resp.raise_for_status()

    # Fetch hotel list page
    resp = session.get(LIST_URL)
    resp.raise_for_status()

    # Extract the hotel JSON from the page
    match = re.search(r"var hotels = (\[.*?\]);\s*$", resp.text, re.MULTILINE | re.DOTALL)
    if not match:
        raise RuntimeError("Could not find hotel data in page")

    return json.loads(match.group(1))


def check_availability(hotels):
    """
    Check which hotels have rooms available for ALL nights July 1-5.
    Returns a list of dicts with available hotel/room info.
    """
    available = []

    for hotel in hotels:
        hotel_name = hotel["name"]
        blocks = hotel.get("blocks", [])

        for block in blocks:
            room_name = block.get("name", "Unknown Room")
            inventory = block.get("inventory", [])

            if not inventory:
                continue

            # A room is fully available if every night has available > 0
            all_available = all(night.get("available", 0) > 0 for night in inventory)

            if all_available:
                rates = [night["rate"] for night in inventory if night.get("rate", 0) > 0]
                avg_rate = sum(rates) / len(rates) if rates else 0
                available.append({
                    "hotel": hotel_name,
                    "room": room_name,
                    "avg_rate": avg_rate,
                    "nights": [
                        {
                            "date": f"{inv['date'][0]}-{inv['date'][1]:02d}-{inv['date'][2]:02d}",
                            "rate": inv["rate"],
                            "available": inv["available"],
                        }
                        for inv in inventory
                    ],
                })

    return available


def notify(message):
    """Send a desktop notification (Linux). Falls back to terminal bell."""
    try:
        import subprocess
        subprocess.run(
            ["notify-send", "-u", "critical", "Hotel Available!", message],
            check=False,
            timeout=5,
        )
    except FileNotFoundError:
        pass
    # Terminal bell
    print("\a")


def main():
    print("=" * 60)
    print("Anime Expo 2026 Hotel Availability Checker")
    print(f"Checking: {CHECK_IN} to {CHECK_OUT}")
    print(f"Interval: every {CHECK_INTERVAL_SECONDS // 60} minutes")
    print(f"Booking URL: {BOOKING_URL}")
    print("=" * 60)
    print()

    previously_available = set()

    while True:
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{now}] Checking availability...")

        try:
            session = get_session()
            hotels = search_hotels(session)
            available = check_availability(hotels)

            if available:
                print(f"\n{'!'*60}")
                print(f"  ROOMS AVAILABLE! ({len(available)} room types)")
                print(f"{'!'*60}\n")

                for room in available:
                    room_key = f"{room['hotel']} - {room['room']}"
                    is_new = room_key not in previously_available
                    new_tag = " ** NEW **" if is_new else ""
                    previously_available.add(room_key)

                    print(f"  Hotel: {room['hotel']}{new_tag}")
                    print(f"  Room:  {room['room']}")
                    print(f"  Avg Rate: ${room['avg_rate']:.2f}/night")
                    for night in room["nights"]:
                        print(f"    {night['date']}: ${night['rate']:.2f} "
                              f"({night['available']} avail)")
                    print()

                    if is_new:
                        notify(f"{room['hotel']} - {room['room']} "
                               f"(${room['avg_rate']:.0f}/night)")

                print(f"  Book now: {BOOKING_URL}")
                print()
            else:
                print(f"[{now}] No full-stay availability found. "
                      f"({len(hotels)} hotels checked)")
                previously_available.clear()

        except requests.RequestException as e:
            print(f"[{now}] Network error: {e}")
        except Exception as e:
            print(f"[{now}] Error: {e}")

        print(f"[{now}] Next check in {CHECK_INTERVAL_SECONDS // 60} minutes...\n")
        time.sleep(CHECK_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
