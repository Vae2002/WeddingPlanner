from concurrent.futures import ThreadPoolExecutor
import io, os
import uuid
from flask import Flask, logging, render_template, request, jsonify, redirect, url_for, session
from sqlalchemy import create_engine
import pandas as pd
from datetime import datetime
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
import json

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

private_key_vae = os.getenv("private_key")

    # Properly format the private key
formatted_key_vae = private_key_vae.replace('\\n', '\n')

credentials_dict = {
    "type": os.getenv("type"),
    "project_id": os.getenv("project_id"),
    "private_key_id": os.getenv("private_key_id"),
    "private_key": formatted_key_vae,
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
  

def download_single_image(file, destination_folder, credentials):
    try:
        drive_service = build('drive', 'v3', credentials=credentials)
        file_id = file['id']
        created_time = file.get('createdTime', '')
        file_name = file['name']

        if created_time:
            timestamp = datetime.fromisoformat(created_time.replace('Z', '+00:00')).strftime('%Y%m%d_%H%M%S')
            file_name = f"{timestamp}_{file_name}"

        file_path = os.path.join(destination_folder, file_name)

        # ✅ Skip if already exists
        if os.path.exists(file_path):
            print(f"[{file_name}] Already exists, skipping.")
            return

        # ✅ Download with safe file handle using 'with' block
        request = drive_service.files().get_media(fileId=file_id)
        with open(file_path, 'wb') as f:
            downloader = MediaIoBaseDownload(f, request)
            done = False
            while not done:
                status, done = downloader.next_chunk()
                print(f"[{file_name}] {int(status.progress() * 100)}% downloaded")

        # ✅ Optionally double-check file was written
        if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
            print(f"[{file_name}] Download may have failed. File is empty.")
            return

    except Exception as e:
        print(f"Error downloading {file_name}: {e}")


def download_images_from_drive(folder_id, destination_folder, credentials, page_token=None, max_files=10):
    drive_service = build('drive', 'v3', credentials=credentials)

    results = drive_service.files().list(
        q=f"'{folder_id}' in parents and mimeType contains 'image/' and trashed=false",
        fields="nextPageToken, files(id, name, createdTime)",
        orderBy="createdTime desc",
        pageSize=max_files,
        pageToken=page_token
    ).execute()

    files = results.get('files', [])
    next_token = results.get('nextPageToken')

    downloaded_filenames = []

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = []
        for file in files:
            future = executor.submit(download_single_image, file, destination_folder, credentials)
            futures.append((future, file))

        for future, file in futures:
            future.result()
            created_time = file.get('createdTime', '')
            file_name = file['name']
            if created_time:
                timestamp = datetime.fromisoformat(created_time.replace('Z', '+00:00')).strftime('%Y%m%d_%H%M%S')
                file_name = f"{timestamp}_{file_name}"
            downloaded_filenames.append(file_name)

    return downloaded_filenames, next_token

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def login_page():
    return render_template('login.html') 

import re

# Function to normalize unwanted phrases (like '& Partner' and '& Family')
def normalize_username(username):
    # Replace '& Partner' and '& Family' with 'and' (case insensitive)
    username = re.sub(r'\s*&\s*(Partner|Family|Fam)', 'and', username, flags=re.IGNORECASE)
    # Remove all special characters (if needed), handle spaces and make lowercase
    username = re.sub(r'[^a-z0-9]', '', username.strip().lower())  # Only keep alphanumeric characters
    return username

@app.route('/login', methods=['POST'])
def login():
    # Get the input username and normalize it (lowercase, strip, remove spaces)
    input_username = request.form.get('username', '').strip().lower().replace(' ', '')

    # Apply custom normalization to the input username
    input_username = normalize_username(input_username)

    if input_username:
        # Fetch users from the database
        user_df = pd.read_sql("SELECT * FROM guest_database", con=engine)
        
        # Normalize the usernames from the database
        user_df['normalized_username'] = user_df['username'].apply(normalize_username)

        # Match the normalized input with the normalized usernames from the database
        match = user_df[user_df['normalized_username'].str.contains(input_username, case=False)]

        if not match.empty:
            session['username'] = match.iloc[0]['username']
            session['normalized_username'] = input_username
            return jsonify({'success': True})

    return jsonify({'success': False, 'error': 'Username not found'})


@app.route('/reset-session')
def reset_session():
    session.clear()
    return redirect(url_for('login_page'))  # updated to correct route


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
            if str(record.get('username')).lower() == username.lower():
                is_online = safe_int(record.get('is_online'), 0)
                is_pemberkatan = safe_int(record.get('is_pemberkatan'), 0)
                n_vip = safe_int(record.get('n_vip'), 0)
                is_group = safe_int(record.get('is_group'), 0)
                max_person = safe_int(record.get('n_person'), 1)
                is_coming = safe_int(record.get('is_coming'), None)
                is_filled = safe_int(record.get('is_filled'), 0)
                is_scanned = safe_int(record.get('is_scanned'), 0)
                wishes_raw = record.get('wishes')
                wishes = wishes_raw if wishes_raw and str(wishes_raw).strip() else None
                member_name = record.get('member_name')
                member_name_list = [] 

                if is_group == 1:
                    try:
                        member_name_raw = record.get('member_name', '')
                        member_name_list = eval(member_name_raw) if member_name_raw else []
                        if not isinstance(member_name_list, list):
                            member_name_list = [str(member_name_list)]
                        member_name_list = [name.strip().lower() for name in member_name_list if name]
                        print(member_name_list)
                    except Exception:
                        member_name_list = []

                    try:
                        group_confirm_list = eval(record.get('n_person_confirm', '[]'))
                        n_person_confirm = sum(int(pair[1]) for pair in group_confirm_list if isinstance(pair, list) and len(pair) > 1 and str(pair[1]).isdigit())
                    except Exception as e:
                        print(f"Error parsing group confirm list: {e}")
                        n_person_confirm = 0
                else:
                    n_person_confirm = safe_int(record.get('n_person_confirm'), 0)

                max_available_person = max_person - n_person_confirm

                print("username:", username, ", is_group:", is_group, ", is_online:", is_online,
                      ", max_person:", max_person, ", n_person_confirm:", n_person_confirm, ", wishes:", wishes)

                return jsonify({
                    "username": username,
                    "is_online": is_online,
                    "is_pemberkatan": is_pemberkatan,
                    "n_vip": n_vip,
                    "is_group": is_group,
                    "member_name": member_name,
                    "member_name_list": member_name_list,
                    "max_person": int(max_person), 
                    "max_available_person": int(max_available_person),
                    "is_coming": is_coming,
                    "n_person_confirm": n_person_confirm,
                    "wishes": wishes,
                    "is_filled": is_filled,
                    "kode_angpao": record.get('kode_angpao'),
                    "is_scanned": is_scanned
                })

        # User not found
        return jsonify({
            "username": username,
            "is_online": None,
            "is_pemberkatan": 0,
            "n_vip": 0,
            "max_person": 1,
            "is_coming": None,
            "n_person_confirm": 0,
            "wishes": None,
            "is_filled": 0,
            "is_scanned": 0
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/home')
@login_required
def home():
    if 'username' not in session:
        return redirect(url_for('login'))
    
    username = session['username']
    
    sheet = get_sheet()
    records = sheet.get_all_records()
    df = pd.DataFrame(records)
    
    user_df = df[df['username'].str.strip().str.lower() == username.strip().lower()]
    user_data = user_df.iloc[0].to_dict() if not user_df.empty else {}
    has_confirm = (
        not user_df.empty and
        str(user_df.iloc[0].get('n_person_confirm', '0')).isdigit() and
        int(user_df.iloc[0]['n_person_confirm']) > 0
    )
    image_folder = os.path.join('static', 'images', 'galery')
  
    image_files = [
    os.path.join(file)
    for file in os.listdir(image_folder)
    if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))
    ][:4]  
      # Debugging output
    print("Images galery sent to template:", image_files)

    return render_template('home.html',user=user_data ,images=image_files , has_confirm=has_confirm, show_footer = True, play_audio = True)

import barcode
from barcode.writer import ImageWriter
from flask import send_file

@app.route('/barcode')
@login_required
def barcode_route():
    # if 'username' not in session:
    #     return redirect(url_for('login'))

    username = session['username']
    user_df = pd.read_sql(
        "SELECT * FROM guest_database WHERE username = ?",
        con=engine,
        params=(username,)
    )

    if user_df.empty:
        return "User not found in database", 404

    raw_value = user_df.iloc[0].get('barcode')

    if pd.isna(raw_value) or raw_value == '':
        return "No barcode value found", 404

    # Normalize barcode value
    try:
        barcode_value = str(int(float(raw_value)))  # Removes ".0" and handles float inputs
    except (ValueError, TypeError):
        barcode_value = str(raw_value).strip()

    # Generate barcode
    ean = barcode.get('code128', barcode_value, writer=ImageWriter())
    buffer = io.BytesIO()
    ean.write(buffer)
    buffer.seek(0)

    return send_file(buffer, mimetype='image/png')

# untuk trigger loading screen
@app.route('/search-start')
@login_required
def search_start():
    print("Debug: loadinggg....." , flush=True)

    return render_template('loading_search.html',show_footer = True)  # Shows loader + JS to trigger real download

@app.route('/fetch-images')
@login_required
def fetch_images():
    image_folder = os.path.join('static', 'images', 'explore')
    os.makedirs(image_folder, exist_ok=True)

    try:
        credentials = get_credentials_gdrive()

        downloaded_files, next_token = download_images_from_drive(
            DRIVE_FOLDER_ID, image_folder, credentials
        )
        sorted_files = sorted(downloaded_files, reverse=True)

        # 💾 Store image list and next token in session
        session['image_queue'] = sorted_files
        session['next_page_token'] = next_token

        print("Debug: next_page_token =", next_token, flush=True)
        print("Downloaded files:", sorted_files)

        return jsonify({'status': 'done'})

    except Exception as e:
        print(f"Error in fetch_images: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/search')
@login_required
def search():
    image_files = session.get('image_queue', [])

    # Slice and assign index
    images_with_index = [
        {'url': f'images/explore/{img}', 'index': i}
        for i, img in enumerate(image_files[:10])
    ]

    return render_template(
        'search.html',
        images=images_with_index,
        show_footer=True,
        play_audio=True
    )


@app.route('/load-more-images')
@login_required
def load_more_images():
    page_token = session.get('next_page_token', None)
    image_folder = os.path.join('static', 'images', 'explore')
    os.makedirs(image_folder, exist_ok=True)

    try:
        credentials = get_credentials_gdrive()
        downloaded_files, next_token = download_images_from_drive(
            DRIVE_FOLDER_ID, image_folder, credentials, page_token
        )

        # Get existing image queue
        image_queue = session.get('image_queue', [])

        # Append only new files (in order), avoiding duplicates
        for img in downloaded_files:
            if img not in image_queue:
                image_queue.append(img)

        session['image_queue'] = image_queue
        session['next_page_token'] = next_token

        # Only return the newly added images (with index)
        new_images = []
        for img in downloaded_files:
            if os.path.exists(os.path.join(image_folder, img)):
                if img in image_queue:
                    index = image_queue.index(img)
                    new_images.append({
                        'url': url_for('static', filename=f'images/explore/{img}'),
                        'index': index
                    })


        return jsonify(images=new_images, next_token=next_token)

    except Exception as e:
        print(f"Error in load_more_images: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
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
    return render_template('capture.html', show_footer=False, play_audio = False)

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
    return render_template('wishes.html', show_footer=True, play_audio = True)

@app.route('/get-all-wishes', methods=['GET'])
@login_required
def get_all_wishes():
    try:
        sheet = get_sheet()
        records = sheet.get_all_records()

        wishes_list = []

        def normalize_username(name):
            return name.strip().lower().replace(' ', '_')

        for record in records:
            is_group = str(record.get('is_group')).strip()
            username = normalize_username(str(record.get('username', 'Anonymous')))

            if is_group == '1':
                try:
                    member_names = eval(record.get('member_name', '[]'))
                    wishes = eval(record.get('wishes', '[]'))

                    if isinstance(member_names, list) and isinstance(wishes, list):
                        for w in wishes:
                            if isinstance(w, list) and len(w) > 1:
                                index, wish_text = w
                                if isinstance(index, int) and 0 <= index < len(member_names):
                                    normalized_member = normalize_username(member_names[index])
                                    wishes_list.append({
                                        "username": normalized_member,
                                        "wish": wish_text.strip()
                                    })
                except Exception as e:
                    print(f"Error processing group wishes: {e}")
            else:
                wish_text = str(record.get('wishes', '')).strip()
                if wish_text:
                    wishes_list.append({
                        "username": username,
                        "wish": wish_text
                    })

        return jsonify({"wishes": wishes_list})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/rsvp')
@login_required
def rsvp():
    sheet = get_sheet()
    records = sheet.get_all_records()

    def safe_int(value, default=0):
        try:
            return int(value) if str(value).strip() != '' else default
        except (ValueError, TypeError):
            return default

    total_n_person_confirm = 0
    for r in records:
        val = r.get("n_person_confirm")
        if isinstance(val, (int, float)):
            total_n_person_confirm += int(val)
        elif isinstance(val, str) and val.strip().startswith("["):
            try:
                parsed = eval(val)
                if isinstance(parsed, list):
                    total_n_person_confirm += sum(
                        int(x[1]) for x in parsed
                        if isinstance(x, list) and len(x) > 1 and str(x[1]).isdigit()
                    )
            except Exception as e:
                print("Warning: Failed to parse n_person_confirm:", val, "Error:", e)

    return render_template(
        'messenger.html',
        total_n_person_confirm=total_n_person_confirm,
        show_footer=False,
        play_audio=True
    )

@app.route('/submit-answers', methods=['POST'])
def submit_answers():
    if 'username' not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    username = session['username']
    data = request.json  # this is a list

    member_name_raw = request.args.get("memberName")

    rsvp_tuple_raw = request.args.get("rsvpTuple")
    try:
        rsvp_tuple_val = json.loads(rsvp_tuple_raw) if rsvp_tuple_raw else None
    except Exception as e:
        print("Error decoding rsvp_tuple_raw:", e)
        rsvp_tuple_val = None

    try:
        member_name_val = json.loads(member_name_raw) if member_name_raw else None
    except Exception as e:
        print("Error decoding member_name_raw:", e)
        member_name_val = None


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
            def normalize_name(name):
                return str(name).strip().lower().replace(' ', '')

            if normalize_name(record.get('username')) == normalize_name(username):
                # Get column indices
                keys = list(record.keys())
                is_coming_col   = keys.index('is_coming') + 1
                n_person_col    = keys.index('n_person_confirm') + 1
                wishes_col      = keys.index('wishes') + 1
                is_filled_col   = keys.index('is_filled') + 1
                member_name_col = keys.index('member_name') + 1

                # Handle member name
                existing_member_name = record.get('member_name', '')
                print("Existing member:", existing_member_name)

                try:
                    current_names = eval(existing_member_name) if existing_member_name else []
                    if not isinstance(current_names, list):
                        current_names = [str(current_names)]
                except Exception:
                    current_names = [str(existing_member_name)] if existing_member_name else []

                # Determine if user is a group
                import math

                raw_group_val = record.get('is_group', 0)
                is_group_val = 0

                try:
                    if raw_group_val is not None and not (isinstance(raw_group_val, float) and math.isnan(raw_group_val)):
                        is_group_val = int(raw_group_val)
                except (ValueError, TypeError):
                    is_group_val = 0

                
                print(is_group_val)

                if is_group_val == 0:
                    sheet.update_cell(idx, n_person_col, n_person_val if n_person_val is not None else '')
                    sheet.update_cell(idx, wishes_col, '' if wishes_val.lower() == 'no, thank you.' else wishes_val)
                    sheet.update_cell(idx, is_coming_col, is_coming_val)
                    sheet.update_cell(idx, is_filled_col, 1)
                    print("✅ Stored in non group values.")
                elif is_group_val == 1 and member_name_val:
                    try:
                        existing_val = record.get('n_person_confirm', '')
                        current_tuple = eval(existing_val) if existing_val else []
                        if not isinstance(current_tuple, list):
                            current_tuple = []
                    except Exception as e:
                        print("Error parsing existing tuple:", e)
                        current_tuple = []

                    # Get current names
                    existing_member_name = record.get('member_name', '')
                    try:
                        current_names = eval(existing_member_name) if existing_member_name else []
                        if not isinstance(current_names, list):
                            current_names = [str(current_names)]
                    except Exception:
                        current_names = [str(existing_member_name)] if existing_member_name else []

                    # ✅ FIRST: update the current_names list
                    if isinstance(member_name_val, list):
                        current_names.extend([name for name in member_name_val if name and name not in current_names])
                    elif isinstance(member_name_val, str) and member_name_val not in current_names:
                        current_names.append(member_name_val)

                    sheet.update_cell(idx, member_name_col, str(current_names))

                    # ✅ THEN: calculate the correct index
                    new_index = len(current_names) - 1  # subtract 1 since we just added a new one

                    # Extract headcount
                    headcount = None
                    for item in data:
                        if item['question'].strip().lower() == "how many people are attending?":
                            if item['answer'].strip().isdigit():
                                headcount = item['answer'].strip()

                    if headcount is not None:
                        new_tuple = [new_index, headcount]
                        if new_tuple not in current_tuple:
                            current_tuple.append(new_tuple)

                        sheet.update_cell(idx, n_person_col, str(current_tuple))
                        print("✅ Appended tuple RSVP for group:", current_tuple)

                    # Handle wishes as a tuple list for group
                    try:
                        existing_wishes = record.get('wishes', '')
                        current_wishes = eval(existing_wishes) if existing_wishes else []
                        if not isinstance(current_wishes, list):
                            current_wishes = []
                    except Exception as e:
                        print("Error parsing existing wishes tuple:", e)
                        current_wishes = []

                    # Add new tuple if valid
                    if wishes_val and wishes_val.lower() != 'no, thank you.':
                        wish_tuple = [new_index, wishes_val]
                        if wish_tuple not in current_wishes:
                            current_wishes.append(wish_tuple)
                        sheet.update_cell(idx, wishes_col, str(current_wishes))
                        print("✅ Stored wishes as tuple:", current_wishes)
                    else:
                        print("No wishes added.")

                else:
                    print ("Error on storing confirmed attendance.")

                return jsonify({"status": "success", "message": f"Updated RSVP for {username}."})

        return jsonify({"status": "error", "message": "Username not found in sheet."}), 404

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route('/voice_call')
@login_required
def voice_call():
    return render_template('voice_call.html', show_footer=False, play_audio = False)

@app.route('/video_call')
@login_required
def video_call():
    return render_template('video_call.html', show_footer=False, play_audio = False)

@app.route('/reels')
@login_required
def reels():
    return render_template('reels.html', show_footer=True, play_audio = False)

@app.route('/profile')
@login_required
def profile():
    image_folder = os.path.join('static', 'images', 'galery')
    image_files = [
        os.path.join(file)
        for file in os.listdir(image_folder)
        if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))
    ]

    sheet = get_sheet()
    records = sheet.get_all_records()

    def safe_int(value, default=0):
        try:
            return int(value) if str(value).strip() != '' else default
        except (ValueError, TypeError):
            return default

    # Total of n_person values
    total_n_person = sum(safe_int(r.get("n_person"), 0) for r in records)

    # Total of all confirmed headcounts
    total_n_person_confirm = 0
    for r in records:
        val = r.get("n_person_confirm")
        if isinstance(val, (int, float)):
            total_n_person_confirm += int(val)
        elif isinstance(val, str) and val.strip().startswith("["):
            try:
                parsed = eval(val)
                if isinstance(parsed, list):
                    total_n_person_confirm += sum(
                        int(x[1]) for x in parsed
                        if isinstance(x, list) and len(x) > 1 and str(x[1]).isdigit()
                    )
            except Exception as e:
                print("Warning: Failed to parse n_person_confirm:", val, "Error:", e)

    return render_template(
        'profile.html',
        images=image_files,
        total_n_person=total_n_person,
        total_n_person_confirm=total_n_person_confirm,
        show_footer=True,
        play_audio=True
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
