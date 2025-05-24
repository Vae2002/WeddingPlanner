import io
import uuid
from flask import Flask, logging, render_template, request, jsonify, redirect, url_for, session
from sqlalchemy import create_engine
import pandas as pd
from datetime import datetime
import os
import base64
from functools import wraps
import gspread
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.http import MediaIoBaseDownload
from oauth2client.service_account import ServiceAccountCredentials
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from google.oauth2 import service_account
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

SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

# Construct credentials dict from environment variables
credentials_dict = {
    "type": os.getenv("type"),
    "project_id": os.getenv("project_id"),
    "private_key_id": os.getenv("private_key_id"),
    "private_key": os.getenv("private_key"),
    "client_email": os.getenv("client_email"),
    "client_id": os.getenv("client_id"),
    "auth_uri": os.getenv("auth_uri"),
    "token_uri": os.getenv("token_uri"),
    "auth_provider_x509_cert_url": os.getenv("auth_provider_x509_cert_url"),
    "client_x509_cert_url": os.getenv("client_x509_cert_url")
}

# Spreadsheet details
SPREADSHEET_ID = '1a-BSIrk5GKDXY6WNGZbYX5WEMx2Ph6lLxV-SYkoA83k'
SHEET_NAME = 'Sheet1'

def get_sheet():
    creds = ServiceAccountCredentials.from_json_keyfile_dict(credentials_dict, SCOPES)
    try:
        client = gspread.authorize(creds)
    except Exception as e:
        print(f"Failed to authorize Google Sheets client: {e}")
        client = None  # Optional: set client to None or handle accordingly

    return client.open_by_key(SPREADSHEET_ID).worksheet(SHEET_NAME)

# Connect and save to SQLite
engine = create_engine('sqlite:///guest.db')
df.to_sql('guest_database', con=engine, if_exists='replace', index=False)

#gdrive connection
SCOPES_GDRIVE = ['https://www.googleapis.com/auth/drive']

def get_credentials_gdrive():
    private_key_stef = os.getenv("PRIVATE_KEY2")

    # Properly format the private key
    formatted_key = private_key_stef.replace('\\n', '\n')

    gdrive_credentials_info = {
        "type": "service_account",
        "project_id": os.getenv("PROJECT_ID2"),
        "private_key_id": os.getenv("PRIVATE_KEY_ID2"),
        "private_key": formatted_key,
        "client_email": os.getenv("CLIENT_EMAIL2"),
        "client_id": os.getenv("CLIENT_ID2"),
        "auth_uri": os.getenv("AUTH_URI2"),
        "token_uri": os.getenv("TOKEN_URI2"),
        "auth_provider_x509_cert_url": os.getenv("AUTH_PROVIDER_X509_CERT_URL2"),
        "client_x509_cert_url": os.getenv("CLIENT_X509_CERT_URL2")
    }
    credentials = service_account.Credentials.from_service_account_info(gdrive_credentials_info, scopes=SCOPES_GDRIVE)
    return credentials
    
# Config
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
DRIVE_FOLDER_ID = '149JwIKVXdm_zD_1WFS2S_c19VN9-X-Q7'  # Replace with your Drive folder ID

def upload_to_drive(file_path, file_name, credentials):
    drive_service = build('drive', 'v3', credentials=credentials)

    file_metadata = {
        'name': file_name,
        'parents': [DRIVE_FOLDER_ID]
    }

    media = MediaFileUpload(file_path, mimetype='image/jpeg')  # Adjust MIME type as needed
    file = drive_service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id'
    ).execute()

    return file.get('id')

@app.route('/upload-to-drive/<filename>', methods=['POST'])
def upload_to_drive_route(filename):
        print("masuk upload file - Debug: filename =", filename, flush=True)
        if not filename:
            return jsonify({'error': 'Filename is required'}), 400
        
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404

        credentials = get_credentials_gdrive()
        file_id = upload_to_drive(file_path, filename, credentials)
        
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
        
        return jsonify({'message': 'File uploaded successfully', 'file_id': file_id})
    # except Exception as e:
    #     return jsonify({'error': str(e)}), 500

def download_images_from_drive(folder_id, destination_folder, credentials):
    drive_service = build('drive', 'v3', credentials=credentials)
    print("Debug: Downloading images from Google Drive...")
    # List files in the Google Drive folder
    results = drive_service.files().list(
        q=f"'{folder_id}' in parents and mimeType contains 'image/' and trashed=false",
        fields="files(id, name)"
    ).execute()

    files = results.get('files', [])

    for file in files:
        file_id = file['id']
        file_name = file['name']
        request = drive_service.files().get_media(fileId=file_id)
        fh = io.FileIO(os.path.join(destination_folder, file_name), 'wb')
        downloader = MediaIoBaseDownload(fh, request)

        done = False
        while not done:
            status, done = downloader.next_chunk()
            print(f"Downloaded {file_name} {int(status.progress() * 100)}%")
    
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

    try:
        sheet = get_sheet()
        records = sheet.get_all_records()

        for record in records:
            if str(record.get('username')).strip().lower() == username.lower():
                is_online = int(record.get('is_online'))
                is_pemberkatan = int(record.get('is_pemberkatan'))
                is_vip = int(record.get('is_vip'))
                n_vip = int(record.get('n_vip'))

                return jsonify({"is_online": is_online, "is_pemberkatan": is_pemberkatan, "is_vip": is_vip, "n_vip": n_vip})

        return jsonify({"is_online": 1, "is_pemberkatan": 0, "is_vip": 0, "n_vip": 0})  

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
    os.makedirs(image_folder, exist_ok=True)

    # Download from Google Drive
    credentials = get_credentials_gdrive()  # Your existing credential function
    download_images_from_drive(DRIVE_FOLDER_ID, image_folder, credentials)
 
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

    filename = f"capture_{uuid.uuid4().hex}.jpg"
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    
    print("Debug: filename =", filename, flush=True)

    with open(file_path, 'wb') as f:
        f.write(img_bytes)

        return jsonify({
            "message": "Photo saved successfully!",
            "filename": filename
        })

   
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
    
@app.route('/get-max-person', methods=['GET'])
@login_required
def get_max_person():
    username = session['username']

    try:
        sheet = get_sheet()
        records = sheet.get_all_records()

        for record in records:
            if str(record.get('username')).strip().lower() == username.lower():
                n_person = record.get('n_person')
                # Return it as int if possible or 0
                try:
                    max_person = int(n_person)
                except (ValueError, TypeError):
                    max_person = 0
                return jsonify({"max_person": max_person})

        return jsonify({"max_person": 0})  # default if not found

    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
