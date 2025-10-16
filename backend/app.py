# app.py (Python/Flask Web Service)

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import os  # Used for accessing environment variables on Render

app = Flask(__name__)

# Enable CORS for the frontend (allowing the static site to talk to the API)
# In production, replace "*" with your specific frontend URL on Render.
CORS(app)


# Mock MongoDB Connection setup (This is where your real connection would go)
# On Render, you would retrieve your connection string from an environment variable:
# MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')



# ------------------------------------------------------------------
# 1. THE API ENDPOINT
# This endpoint receives the POST request from the static client.
@app.route('/api/saveData', methods=['POST'])
def save_data():
    # 1. Get the JSON data sent from the client
    data = request.get_json()

    # Check if data was sent and has the required key
    if not data or 'userEmail' not in data:
        return jsonify({
            'message': 'Error: Missing userEmail in request body.'
        }), 400

    user_email = data.get('userEmail')

    # 2. Call the database function
    if mock_save_to_db(user_email):
        # 3. Send a success response back to the static client
        return jsonify({
            'message': f"Success! Email {user_email} saved.",
            'serverTimestamp': datetime.now().isoformat()
        }), 200
    else:
        # 3. Send an error response
        return jsonify({
            'message': "Error saving data to the database."
        }), 500


if __name__ == '__main__':
    print(f"Web Service (API) running on http://localhost:{5000}")
    app.run(debug=True)

# To run this:
# 1. pip install Flask flask-cors
# 2. python app.py