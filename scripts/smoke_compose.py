"""Exercise the public evaluator entrypoint without depending on YouTube."""

import json
import re
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:3000"


def main():
    with urllib.request.urlopen(f"{BASE}/api/health", timeout=10) as response:
        assert response.status == 200
        assert json.load(response)["status"] == "online"

    request = urllib.request.Request(
        f"{BASE}/api/transcript",
        data=b'{"url":"https://example.com/not-youtube"}',
        headers={"Content-Type": "application/json"},
    )
    try:
        urllib.request.urlopen(request, timeout=10)
    except urllib.error.HTTPError as error:
        assert error.code == 400, error.code
        assert json.load(error)["success"] is False
    else:
        raise AssertionError("Invalid input was accepted")

    for route in ["/", "/history"]:
        with urllib.request.urlopen(f"{BASE}{route}", timeout=10) as response:
            html = response.read().decode()
            assert '<div id="root">' in html
            for asset in re.findall(r'(?:src|href)="(/assets/[^\"]+)"', html):
                with urllib.request.urlopen(f"{BASE}{asset}", timeout=10) as resource:
                    assert resource.status == 200
    print("Compose smoke checks passed: health, rejected input, assets, SPA fallback.")


if __name__ == "__main__":
    main()
