from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from sqlalchemy import create_engine
import pandas as pd
from datetime import datetime
import os
import base64
from functools import wraps
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
app.secret_key = 'laststeftoeunity'

UPLOAD_FOLDER = 'static/captures'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.context_processor
def inject_year():
    return {'current_year': datetime.now().year}

csv_url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTxhbKO06Y36vTyEiFgxZXXVtWkNebIQ-3diUm5xpAtMT1uHJIGF4Jvkt3bm8dKYo-5C6PkdQwrAX21/pub?output=csv'
df = pd.read_csv(csv_url)

# Google Sheets setup
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

print(f"Using credentials file: {SERVICE_ACCOUNT_FILE}")
if not os.path.exists(SERVICE_ACCOUNT_FILE):
    raise FileNotFoundError(f"Credentials file not found at: {SERVICE_ACCOUNT_FILE}")

# Spreadsheet details
SPREADSHEET_ID = '1a-BSIrk5GKDXY6WNGZbYX5WEMx2Ph6lLxV-SYkoA83k'  # or spreadsheet ID from the URL
SHEET_NAME = 'Sheet1'  # replace with your actual sheet name

def get_sheet():
    creds = ServiceAccountCredentials.from_json_keyfile_name(SERVICE_ACCOUNT_FILE, SCOPES)
    client = gspread.authorize(creds)
    return client.open_by_key(SPREADSHEET_ID).worksheet(SHEET_NAME)

# Connect and save to SQLite
engine = create_engine('sqlite:///guest.db')
df.to_sql('guest_database', con=engine, if_exists='replace', index=False)


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        if username:
            # Check if user exists
            user_df = pd.read_sql("SELECT * FROM guest_database WHERE username = ?", con=engine, params=(username,))
            if not user_df.empty:
                session['username'] = username
                return redirect(url_for('home'))
            else:
                return render_template('login.html', error="Username not found.")
    return render_template('login.html')

@app.route('/reset-session')
def reset_session():
    session.clear()
    return redirect(url_for('login'))

@app.route('/get-user-info', methods=['GET'])
@login_required
def get_user_info():
    username = session['username']

    def safe_int(value, default=None):
        try:
            return int(value) if str(value).strip() != '' else default
        except (ValueError, TypeError):
            return default

    try:
        sheet = get_sheet()
        records = sheet.get_all_records()

        for record in records:
            if str(record.get('username')).strip().lower() == username.lower():
                is_online = safe_int(record.get('is_online'), 0)
                is_pemberkatan = safe_int(record.get('is_pemberkatan'), 0)
                is_vip = safe_int(record.get('is_vip'), 0)
                n_vip = safe_int(record.get('n_vip'), 0)
                max_person = safe_int(record.get('n_person'), 1)
                is_coming = safe_int(record.get('is_coming'), None)

                wishes_raw = record.get('wishes')
                wishes = wishes_raw if wishes_raw and str(wishes_raw).strip() else None

                return jsonify({
                    "username": username,
                    "is_online": is_online,
                    "is_pemberkatan": is_pemberkatan,
                    "is_vip": is_vip,
                    "n_vip": n_vip,
                    "max_person": max_person,
                    "is_coming": is_coming,
                    "wishes": wishes
                })

        # User not found
        return jsonify({
            "username": username,
            "is_online": None,
            "is_pemberkatan": 0,
            "is_vip": 0,
            "n_vip": 0,
            "max_person": 1,
            "is_coming": None,
            "wishes": None
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/home')
@login_required
def home():
    if 'username' not in session:
        return redirect(url_for('login'))
    
    username = session['username']
    user_df = pd.read_sql("SELECT * FROM guest_database WHERE username = ?", con=engine, params=(username,))
    user_data = user_df.iloc[0].to_dict() if not user_df.empty else {}

    return render_template('home.html', user=user_data, show_footer = True)

@app.route('/search')
@login_required
def search():
    image_folder = os.path.join('static', 'images', 'explore')
    image_files = [
        os.path.join(file)
        for file in os.listdir(image_folder)
        if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))
    ]
      # Debugging output
    print("Images sent to template:", image_files)
    return render_template('search.html', images=image_files, show_footer=True)

def map_view():
    latitude = 37.4219999
    longitude = -122.0840575
    label = "My+Location"
    
    # Google Maps URL for redirection
    maps_url = f"https://www.google.com/maps/search/?api=1&query={latitude},{longitude}"

    return render_template('search.html', lat=latitude, lng=longitude, maps_url=maps_url)

@app.route('/capture')
@login_required
def capture():
    return render_template('capture.html', show_footer=False)

@app.route('/save-photo', methods=['POST'])
@login_required
def save_photo():
    data = request.get_json()
    image_data = data['image']
    
    header, encoded = image_data.split(',', 1)
    img_bytes = base64.b64decode(encoded)

    filename = f"capture_{len(os.listdir(UPLOAD_FOLDER)) + 1}.jpg"
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    
    with open(file_path, 'wb') as f:
        f.write(img_bytes)
    
    return jsonify({"message": "Photo saved successfully!", "filename": filename})

@app.route('/delete-photo/<filename>', methods=['DELETE'])
@login_required
def delete_photo(filename):
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify({"message": "Photo deleted."})
    else:
        return jsonify({"error": "File not found."}), 404

@app.route('/wishes')
@login_required
def wishes():
    return render_template('wishes.html', show_footer=True)

@app.route('/get-all-wishes', methods=['GET'])
@login_required
def get_all_wishes():
    try:
        sheet = get_sheet()
        records = sheet.get_all_records()

        # Extract username and wishes, only if wish text exists
        wishes_list = [
            {
                "username": record.get('username', 'Anonymous').strip(),
                "wish": record.get('wishes', '').strip()
            }
            for record in records if record.get('wishes', '').strip()
        ]

        return jsonify({"wishes": wishes_list})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/messenger')
@login_required
def messenger():
    return render_template('messenger.html', show_footer=False)

@app.route('/submit-answers', methods=['POST'])
def submit_answers():
    if 'username' not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    username = session['username']
    data = request.json

    is_coming_val = None
    n_person_val = None
    wishes_val = ''

    for item in data:
        question = item['question'].strip().lower()
        answer = item['answer'].strip()

        if question == "are you coming?":
            if answer.lower() == 'yes':
                is_coming_val = 1
            elif answer.lower() == 'no':
                is_coming_val = 0
            elif answer.lower() == "i will be attending online":
                is_coming_val = 0
            else:
                return jsonify({"status": "skipped", "message": "User is still unsure."})

        elif question == "how many people are attending?":
            if answer.isdigit():
                n_person_val = int(answer)
            else:
                n_person_val = None

        elif question == "any wishes for the bride & groom?":
            wishes_val = '' if answer.lower() == 'no' else answer

    if is_coming_val is None:
        return jsonify({"status": "skipped", "message": "No valid attendance answer found."})

    try:
        sheet = get_sheet()
        records = sheet.get_all_records()

        # Find the row number
        for idx, record in enumerate(records, start=2):
            if str(record.get('username')).strip().lower() == username.lower():
                # Get column indices
                keys = list(record.keys())
                is_coming_col = keys.index('is_coming') + 1
                n_person_col = keys.index('n_person_confirm') + 1
                wishes_col = keys.index('wishes') + 1

                # Update each relevant cell
                sheet.update_cell(idx, is_coming_col, is_coming_val)
                sheet.update_cell(idx, n_person_col, n_person_val if n_person_val is not None else '')
                sheet.update_cell(idx, wishes_col, wishes_val)

                return jsonify({"status": "success", "message": f"Updated RSVP for {username}."})

        return jsonify({"status": "error", "message": "Username not found in sheet."}), 404

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/voice_call')
@login_required
def voice_call():
    return render_template('voice_call.html', show_footer=False)

@app.route('/video_call')
@login_required
def video_call():
    return render_template('video_call.html', show_footer=False)

@app.route('/reels')
@login_required
def reels():
    return render_template('reels.html', show_footer=True)

@app.route('/profile')
@login_required
def profile():
    image_folder = os.path.join('static', 'images', 'explore')
    image_files = [
        os.path.join(file)
        for file in os.listdir(image_folder)
        if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))
    ]
      # Debugging output
    print("Images sent to template:", image_files)
    return render_template('profile.html', images=image_files, show_footer=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
