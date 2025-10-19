from flask import Flask, jsonify, request
from midi_parser import midi_to_json
import os

app = Flask(__name__)


@app.route('/')
def home():
    return jsonify({
        'message': 'Hello from Flask!',
        'status': 'running'
    })

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


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
