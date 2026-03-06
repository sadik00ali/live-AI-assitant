from flask import Blueprint, request, jsonify, Response
import json
import time

alerts_bp = Blueprint("alerts", __name__)

alerts_list = []


@alerts_bp.route("/alerts", methods=["POST"])
def receive_alert():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    alerts_list.append(data)

    print("🚨 ALERT RECEIVED:", data)

    return jsonify({"success": True}), 201


# 🔥 REAL-TIME STREAM
@alerts_bp.route("/stream-alerts")
def stream_alerts():
    def event_stream():
        last_index = 0

        while True:
            if len(alerts_list) > last_index:
                new_alert = alerts_list[-1]
                last_index = len(alerts_list)

                yield f"data: {json.dumps(new_alert)}\n\n"

            time.sleep(0.5)

    return Response(event_stream(), mimetype="text/event-stream")