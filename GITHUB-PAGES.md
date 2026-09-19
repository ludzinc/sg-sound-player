# GitHub Pages update

Upload everything in this `pwa` folder to the root of the existing GitHub Pages repository, including the `assets` folder. Replace the existing files.

The interface uses four app-style views in one HTML document so changing sections does not disconnect BLE.

Copy the updated `ble_server.py` to `/home/pi/rpiWebServer/ble_server.py`, then run `sudo supervisorctl restart sg-ble`. The supplied project did not contain `static/sounds/10.wav`, so the D'OH button will report that sound 10 is not installed until that file is added.
