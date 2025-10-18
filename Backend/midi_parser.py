import mido
from mido import MidiFile


def midi_to_json(midi_file_path):
    """
    Convert a MIDI file to a JSON-serializable dictionary.

    Args:
        midi_file_path: Path to the MIDI file

    Returns:
        Dictionary containing MIDI data
    """
    try:
        mid = MidiFile(midi_file_path)

        # Extract tempo and time signature
        tempo = 500000  # Default tempo (120 BPM)
        time_signature = "4/4"  # Default time signature
        ticks_per_beat = mid.ticks_per_beat

        # Parse tracks
        tracks_data = []

        for i, track in enumerate(mid.tracks):
            track_name = f"Track {i + 1}"
            notes = []
            current_time = 0

            for msg in track:
                current_time += msg.time

                # Extract tempo
                if msg.type == 'set_tempo':
                    tempo = msg.tempo

                # Extract time signature
                if msg.type == 'time_signature':
                    time_signature = f"{msg.numerator}/{msg.denominator}"

                # Extract track name
                if msg.type == 'track_name':
                    track_name = msg.name

                # Extract note_on events
                if msg.type == 'note_on' and msg.velocity > 0:
                    # Find corresponding note_off
                    temp_time = current_time
                    duration_ticks = 0

                    for future_msg in track[track.index(msg) + 1:]:
                        temp_time += future_msg.time
                        if (future_msg.type == 'note_off' and future_msg.note == msg.note) or \
                           (future_msg.type == 'note_on' and future_msg.note == msg.note and future_msg.velocity == 0):
                            duration_ticks = temp_time - current_time
                            break

                    # Convert ticks to seconds
                    seconds_per_tick = (tempo / 1000000) / ticks_per_beat
                    time_seconds = current_time * seconds_per_tick
                    duration_seconds = duration_ticks * seconds_per_tick

                    notes.append({
                        "note": msg.note,
                        "time": round(time_seconds, 3),
                        "duration": round(duration_seconds, 3),
                        "velocity": msg.velocity
                    })

            if notes:  # Only add tracks with notes
                tracks_data.append({
                    "track_name": track_name,
                    "notes": notes
                })

        # Calculate total duration
        total_duration = 0
        for track_data in tracks_data:
            if track_data["notes"]:
                last_note = track_data["notes"][-1]
                track_end = last_note["time"] + last_note["duration"]
                total_duration = max(total_duration, track_end)

        # Calculate BPM from tempo
        bpm = round(60000000 / tempo, 2)

        return {
            "filename": midi_file_path.split('/')[-1],
            "tempo": bpm,
            "time_signature": time_signature,
            "duration": round(total_duration, 2),
            "ticks_per_beat": ticks_per_beat,
            "tracks": tracks_data
        }

    except FileNotFoundError:
        raise FileNotFoundError(f"MIDI file not found: {midi_file_path}")
    except Exception as e:
        raise Exception(f"Error parsing MIDI file: {str(e)}")
