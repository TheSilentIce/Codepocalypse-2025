from flask import Flask, jsonify, request
from flask_cors import CORS
from midi_parser import midi_to_json
from werkzeug.utils import secure_filename
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size
app.config['UPLOAD_FOLDER'] = 'user_audio_files'
app.config['MIDI_FOLDER'] = 'midi_files'
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma', 'aiff', 'mid', 'midi'}

# Create upload directories if they don't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['MIDI_FOLDER'], exist_ok=True)


def allowed_file(filename):
    """Check if file has an allowed extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def home():
    return jsonify({
        'message': 'Hello from Flask!',
        'status': 'running'
    })

@app.route('/api/midis', methods=['GET'])
def get_available_midis():
    """
    Get list of available MIDI files (without extensions).

    Returns:
        JSON array of MIDI file names without extensions
    """
    try:
        midi_dir = 'midi_files'

        # Check if directory exists
        if not os.path.exists(midi_dir):
            return jsonify([]), 200

        # Get all files from the directory
        files = os.listdir(midi_dir)

        # Filter for .mid and .midi files and remove extensions
        midi_files = []
        for file in files:
            if file.lower().endswith(('.mid', '.midi')):
                # Remove the extension
                name_without_ext = os.path.splitext(file)[0]
                midi_files.append(name_without_ext)

        return jsonify(midi_files), 200

    except Exception as e:
        return jsonify({
            'error': 'Error retrieving MIDI files',
            'message': str(e)
        }), 500


@app.route('/api/midi', methods=['GET'])
@app.route('/api/midi/<filename>', methods=['GET'])
def get_midi(filename='one dir.mid'):
    """
    Get MIDI file data as JSON.

    Args:
        filename: Name of the MIDI file (optional, defaults to one dir.mid)

    Returns:
        JSON representation of the MIDI file
    """
    try:
        # Construct the file path
        midi_path = os.path.join('midi_files', filename)

        # Check if file exists
        if not os.path.exists(midi_path):
            return jsonify({
                'error': 'MIDI file not found',
                'filename': filename
            }), 404

        # Parse MIDI file to JSON
        midi_data = midi_to_json(midi_path)

        return jsonify(midi_data), 200

    except Exception as e:
        return jsonify({
            'error': 'Error processing MIDI file',
            'message': str(e)
        }), 500


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """
    Upload an audio file to the user_audio_files directory.

    Expects:
        - A file in the request under the key 'file'

    Returns:
        JSON response with success status and file information
    """
    try:
        # Check if file is present in request
        if 'file' not in request.files:
            return jsonify({
                'error': 'No file provided',
                'message': 'Please include a file in the request with key "file"'
            }), 400

        file = request.files['file']

        # Check if file was selected
        if file.filename == '':
            return jsonify({
                'error': 'No file selected',
                'message': 'The file field is empty'
            }), 400

        # Check if file type is allowed
        if not allowed_file(file.filename):
            return jsonify({
                'error': 'Invalid file type',
                'message': f'Allowed file types: {", ".join(ALLOWED_EXTENSIONS)}',
                'filename': file.filename
            }), 400

        # Secure the filename
        original_filename = secure_filename(file.filename)

        # Check if it's a MIDI file
        file_ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
        is_midi = file_ext in {'mid', 'midi'}

        # For MIDI files, use simple filename without timestamp
        if is_midi:
            upload_folder = app.config['MIDI_FOLDER']
            unique_filename = original_filename
        else:
            # For audio files, generate unique filename to prevent overwrites
            upload_folder = app.config['UPLOAD_FOLDER']
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            name, ext = os.path.splitext(original_filename)
            unique_filename = f"{name}_{timestamp}{ext}"

        # Save the file
        filepath = os.path.join(upload_folder, unique_filename)
        file.save(filepath)

        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'filename': unique_filename,
            'original_filename': original_filename,
            'path': filepath,
            'size': os.path.getsize(filepath)
        }), 201

    except Exception as e:
        return jsonify({
            'error': 'Error uploading file',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
