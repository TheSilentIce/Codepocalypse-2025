import os
import shutil
import subprocess
import threading
import time
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from werkzeug.utils import secure_filename

from midi_parser import midi_to_json

app = Flask(__name__)
CORS(app)
app.config["CORS_HEADERS"] = "Content-Type"

# Configuration
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50MB max file size
app.config["UPLOAD_FOLDER"] = "user_audio_files"
app.config["MIDI_FOLDER"] = "midi_files"
ALLOWED_EXTENSIONS = {
    "mp3",
    "wav",
    "ogg",
    "flac",
    "m4a",
    "aac",
    "wma",
    "aiff",
    "mid",
    "midi",
}

# Create upload directories if they don't exist
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
os.makedirs(app.config["MIDI_FOLDER"], exist_ok=True)

# Global state for background processing
processing_jobs = {
    "current_job": None,  # Will store job info when processing
    "job_history": [],  # Store completed/failed jobs
    "last_midi_update": None,  # Track when MIDI list was last updated
}


def allowed_file(filename):
    """Check if file has an allowed extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def process_audio_async(audio_file_path, original_filename):
    """
    Process audio file asynchronously using conda environment.

    Args:
        audio_file_path: Path to the uploaded audio file
        original_filename: Original filename for naming the output MIDI
    """
    job_info = None
    try:
        # Generate unique output directory name (relative to PiCoGen directory)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = f"output_{timestamp}"

        # Create output directory inside PiCoGen
        picogen_dir = os.path.join(os.getcwd(), "PiCoGen")
        full_output_dir = os.path.join(picogen_dir, output_dir)
        os.makedirs(full_output_dir, exist_ok=True)

        # Update job status
        job_info = {
            "status": "running",
            "start_time": datetime.now().isoformat(),
            "audio_file": audio_file_path,
            "output_dir": full_output_dir,
            "original_filename": original_filename,
        }
        processing_jobs["current_job"] = job_info

        # Convert audio file path to be relative to PiCoGen directory
        relative_audio_path = os.path.relpath(audio_file_path, picogen_dir)

        # Run conda command from PiCoGen directory
        cmd = [
            "conda",
            "run",
            "-n",
            "picogen2",
            "./infer.sh",
            "--input_audio",
            relative_audio_path,
            "--output_dir",
            output_dir,
        ]

        # Execute the command and wait for completion (run from PiCoGen directory)
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=picogen_dir)

        if result.returncode == 0:
            # Success - copy piano.mid to midi_files
            piano_mid_path = os.path.join(full_output_dir, "piano.mid")
            if os.path.exists(piano_mid_path):
                # Generate unique MIDI filename
                name, _ = os.path.splitext(original_filename)
                midi_filename = f"{name}_{timestamp}.mid"
                midi_dest_path = os.path.join(app.config["MIDI_FOLDER"], midi_filename)

                # Copy the file
                shutil.copy2(piano_mid_path, midi_dest_path)

                # Update job status
                job_info["status"] = "completed"
                job_info["midi_filename"] = midi_filename
                job_info["completion_time"] = datetime.now().isoformat()

                # Update MIDI list timestamp for UI refresh
                processing_jobs["last_midi_update"] = datetime.now().isoformat()

                print(
                    f"Audio processing completed successfully. MIDI saved as: {midi_filename}"
                )
            else:
                raise Exception("piano.mid not found in output directory")
        else:
            # Command failed
            raise Exception(
                f"Processing failed with return code {result.returncode}: {result.stderr}"
            )

    except Exception as e:
        # Update job status to failed
        if job_info is not None:
            job_info["status"] = "failed"
            job_info["error"] = str(e)
            job_info["completion_time"] = datetime.now().isoformat()
            print(f"Audio processing failed: {e}")
        else:
            print(f"Audio processing failed before job setup: {e}")

    finally:
        # Move job to history and clear current job
        if job_info is not None:
            processing_jobs["job_history"].append(job_info)
        processing_jobs["current_job"] = None

        # Clean up output directory
        if "full_output_dir" in locals() and os.path.exists(full_output_dir):
            try:
                shutil.rmtree(full_output_dir)
            except Exception as e:
                print(f"Failed to clean up output directory {full_output_dir}: {e}")


def start_audio_processing(audio_file_path, original_filename):
    """
    Start audio processing in a background thread if no job is currently running.

    Args:
        audio_file_path: Path to the uploaded audio file
        original_filename: Original filename for naming the output MIDI

    Returns:
        bool: True if processing was started, False if already running
    """
    if processing_jobs["current_job"] is not None:
        return False  # Already processing

    # Start processing in background thread
    thread = threading.Thread(
        target=process_audio_async,
        args=(audio_file_path, original_filename),
        daemon=True,
    )
    thread.start()
    return True


@app.route("/")
def home():
    return jsonify({"message": "Hello from Flask!", "status": "running"})


@app.route("/api/midis", methods=["GET"])
def get_available_midis():
    """
    Get list of available MIDI files (without extensions).

    Returns:
        JSON array of MIDI file names without extensions
    """
    try:
        midi_dir = "midi_files"

        # Check if directory exists
        if not os.path.exists(midi_dir):
            return (
                jsonify(
                    {
                        "midi_files": [],
                        "last_update": processing_jobs["last_midi_update"],
                        "count": 0,
                    }
                ),
                200,
            )

        # Get all files from the directory
        files = os.listdir(midi_dir)

        # Filter for .mid and .midi files and remove extensions
        midi_files = []
        for file in files:
            if file.lower().endswith((".mid", ".midi")):
                # Remove the extension
                name_without_ext = os.path.splitext(file)[0]
                midi_files.append(name_without_ext)

        return (
            jsonify(
                {
                    "midi_files": midi_files,
                    "last_update": processing_jobs["last_midi_update"],
                    "count": len(midi_files),
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": "Error retrieving MIDI files", "message": str(e)}), 500


@app.route("/api/midi", methods=["GET"])
@app.route("/api/midi/<filename>", methods=["GET"])
def get_midi(filename="one dir.mid"):
    """
    Get MIDI file data as JSON.

    Args:
        filename: Name of the MIDI file (optional, defaults to one dir.mid)

    Returns:
        JSON representation of the MIDI file
    """
    try:
        # Construct the file path
        midi_path = os.path.join("midi_files", filename)

        # Check if file exists
        if not os.path.exists(midi_path):
            return jsonify({"error": "MIDI file not found", "filename": filename}), 404

        # Parse MIDI file to JSON
        midi_data = midi_to_json(midi_path)

        return jsonify(midi_data), 200

    except Exception as e:
        return jsonify({"error": "Error processing MIDI file", "message": str(e)}), 500


@app.route("/api/upload", methods=["POST"])
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
        if "file" not in request.files:
            return (
                jsonify(
                    {
                        "error": "No file provided",
                        "message": 'Please include a file in the request with key "file"',
                    }
                ),
                400,
            )

        file = request.files["file"]

        # Check if file was selected
        if file.filename == "":
            return (
                jsonify(
                    {"error": "No file selected", "message": "The file field is empty"}
                ),
                400,
            )

        # Check if file type is allowed
        if not allowed_file(file.filename):
            return (
                jsonify(
                    {
                        "error": "Invalid file type",
                        "message": f'Allowed file types: {", ".join(ALLOWED_EXTENSIONS)}',
                        "filename": file.filename,
                    }
                ),
                400,
            )

        # Secure the filename
        original_filename = secure_filename(file.filename)

        # Check if it's a MIDI file
        file_ext = (
            original_filename.rsplit(".", 1)[1].lower()
            if "." in original_filename
            else ""
        )
        is_midi = file_ext in {"mid", "midi"}

        # For MIDI files, use simple filename without timestamp
        if is_midi:
            upload_folder = app.config["MIDI_FOLDER"]
            unique_filename = original_filename
        else:
            # For audio files, generate unique filename to prevent overwrites
            upload_folder = app.config["UPLOAD_FOLDER"]
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            name, ext = os.path.splitext(original_filename)
            unique_filename = f"{name}_{timestamp}{ext}"

        # Save the file
        filepath = os.path.join(upload_folder, unique_filename)
        file.save(filepath)

        if not is_midi:
            # It's an audio file, so we need to convert it to a MIDI file
            processing_started = start_audio_processing(filepath, original_filename)

            if processing_started:
                return (
                    jsonify(
                        {
                            "success": True,
                            "message": "Audio file uploaded successfully. Processing started in background.",
                            "filename": unique_filename,
                            "original_filename": original_filename,
                            "path": filepath,
                            "size": os.path.getsize(filepath),
                            "processing": {
                                "status": "started",
                                "message": "Audio processing has begun. Check /api/processing/status for updates.",
                            },
                        }
                    ),
                    201,
                )
            else:
                return (
                    jsonify(
                        {
                            "success": True,
                            "message": "Audio file uploaded successfully, but processing is already in progress.",
                            "filename": unique_filename,
                            "original_filename": original_filename,
                            "path": filepath,
                            "size": os.path.getsize(filepath),
                            "processing": {
                                "status": "queued",
                                "message": "Another file is currently being processed. Your file will be processed after it completes.",
                            },
                        }
                    ),
                    201,
                )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "File uploaded successfully",
                    "filename": unique_filename,
                    "original_filename": original_filename,
                    "path": filepath,
                    "size": os.path.getsize(filepath),
                }
            ),
            201,
        )

    except Exception as e:
        return jsonify({"error": "Error uploading file", "message": str(e)}), 500


@app.route("/api/processing/status", methods=["GET"])
def get_processing_status():
    """
    Get the current status of audio processing.

    Returns:
        JSON response with processing status and job information
    """
    current_job = processing_jobs["current_job"]

    if current_job is None:
        return (
            jsonify({"status": "idle", "message": "No processing currently running"}),
            200,
        )

    return (
        jsonify(
            {
                "status": current_job["status"],
                "start_time": current_job["start_time"],
                "original_filename": current_job["original_filename"],
                "audio_file": current_job["audio_file"],
            }
        ),
        200,
    )


@app.route("/api/processing/result", methods=["GET"])
def get_processing_result():
    """
    Get the result of the most recent processing job.

    Returns:
        JSON response with the result of the last completed job
    """
    if not processing_jobs["job_history"]:
        return jsonify({"error": "No processing history available"}), 404

    # Get the most recent job
    latest_job = processing_jobs["job_history"][-1]

    if latest_job["status"] == "completed":
        return (
            jsonify(
                {
                    "status": "completed",
                    "midi_filename": latest_job.get("midi_filename"),
                    "completion_time": latest_job.get("completion_time"),
                    "original_filename": latest_job.get("original_filename"),
                }
            ),
            200,
        )
    elif latest_job["status"] == "failed":
        return (
            jsonify(
                {
                    "status": "failed",
                    "error": latest_job.get("error"),
                    "completion_time": latest_job.get("completion_time"),
                    "original_filename": latest_job.get("original_filename"),
                }
            ),
            200,
        )
    else:
        return (
            jsonify(
                {
                    "status": latest_job["status"],
                    "message": "Job is still running or in unknown state",
                }
            ),
            200,
        )


@app.route("/api/midis/check-updates", methods=["GET"])
def check_midi_updates():
    """
    Check if the MIDI list has been updated since the last check.

    Query Parameters:
        last_check: ISO timestamp of last check (optional)

    Returns:
        JSON response indicating if MIDI list has been updated
    """
    last_check = request.args.get("last_check")
    current_update = processing_jobs["last_midi_update"]

    if last_check and current_update:
        try:
            last_check_dt = datetime.fromisoformat(last_check.replace("Z", "+00:00"))
            current_update_dt = datetime.fromisoformat(
                current_update.replace("Z", "+00:00")
            )
            has_updates = current_update_dt > last_check_dt
        except ValueError:
            has_updates = current_update is not None
    else:
        has_updates = current_update is not None

    return (
        jsonify(
            {
                "has_updates": has_updates,
                "last_update": current_update,
                "current_time": datetime.now().isoformat(),
            }
        ),
        200,
    )


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
