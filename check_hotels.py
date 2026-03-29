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

    Real availability = available - wlAvailable (waitlist count).
    When available == wlAvailable, the night is waitlist-only, not truly bookable.
    A room is only "fully available" if every night has real availability > 0.
    """
    fully_available = []
    partially_available = []

    for hotel in hotels:
        hotel_name = hotel["name"]
        blocks = hotel.get("blocks", [])

        for block in blocks:
            room_name = block.get("name", "Unknown Room")
            inventory = block.get("inventory", [])

            if not inventory:
                continue

            nights_info = []
            for inv in inventory:
                real = inv.get("available", 0) - inv.get("wlAvailable", 0)
                wl = inv.get("wlAvailable", 0)
                if real > 0:
                    status = "AVAILABLE"
                elif wl > 0:
                    status = "WAITLIST"
                else:
                    status = "SOLD OUT"
                nights_info.append({
                    "date": f"{inv['date'][0]}-{inv['date'][1]:02d}-{inv['date'][2]:02d}",
                    "rate": inv["rate"],
                    "real_available": real,
                    "waitlist": wl,
                    "status": status,
                })

            all_real = all(n["real_available"] > 0 for n in nights_info)
            any_real = any(n["real_available"] > 0 for n in nights_info)
            has_waitlist_nights = any(n["status"] == "WAITLIST" for n in nights_info)

            rates = [n["rate"] for n in nights_info if n["rate"] > 0]
            avg_rate = sum(rates) / len(rates) if rates else 0

            entry = {
                "hotel": hotel_name,
                "room": room_name,
                "avg_rate": avg_rate,
                "nights": nights_info,
                "all_nights_available": all_real,
                "has_waitlist_nights": has_waitlist_nights,
            }

            if all_real:
                fully_available.append(entry)
            elif any_real and has_waitlist_nights:
                # Some nights real, some waitlist — partially available
                partially_available.append(entry)

    return fully_available, partially_available


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
            fully_available, partially_available = check_availability(hotels)

            if fully_available:
                print(f"\n{'!'*60}")
                print(f"  FULLY AVAILABLE (all nights confirmed): {len(fully_available)} room(s)")
                print(f"{'!'*60}\n")

                for room in fully_available:
                    room_key = f"{room['hotel']} - {room['room']}"
                    is_new = room_key not in previously_available
                    new_tag = " ** NEW **" if is_new else ""
                    previously_available.add(room_key)

                    print(f"  Hotel: {room['hotel']}{new_tag}")
                    print(f"  Room:  {room['room']}")
                    print(f"  Avg Rate: ${room['avg_rate']:.2f}/night")
                    for night in room["nights"]:
                        print(f"    {night['date']}: ${night['rate']:.2f} [{night['status']}]")
                    print()

                    if is_new:
                        notify(f"BOOKABLE: {room['hotel']} - {room['room']} "
                               f"(${room['avg_rate']:.0f}/night)")

                print(f"  Book now: {BOOKING_URL}")
                print()

            if partially_available:
                print(f"  --- Partially available (some nights waitlisted): "
                      f"{len(partially_available)} room(s) ---\n")
                for room in partially_available:
                    wl_nights = [n["date"] for n in room["nights"] if n["status"] == "WAITLIST"]
                    real_nights = [n["date"] for n in room["nights"] if n["status"] == "AVAILABLE"]
                    print(f"  {room['hotel']} - {room['room']} (${room['avg_rate']:.0f}/night)")
                    print(f"    Available: {', '.join(real_nights)}")
                    print(f"    Waitlist:  {', '.join(wl_nights)}")
                    print()

            if not fully_available and not partially_available:
                print(f"[{now}] No availability found. "
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
