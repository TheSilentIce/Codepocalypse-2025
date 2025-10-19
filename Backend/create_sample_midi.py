import mido
from mido import MidiFile, MidiTrack, Message

# Create a new MIDI file
mid = MidiFile()
track = MidiTrack()
mid.tracks.append(track)

# Set tempo (500000 microseconds per beat = 120 BPM)
track.append(mido.MetaMessage('set_tempo', tempo=500000))

# Set time signature (4/4)
track.append(mido.MetaMessage('time_signature', numerator=4, denominator=4))

# Add track name
track.append(mido.MetaMessage('track_name', name='Piano'))

# Add some notes (C major scale)
notes = [60, 62, 64, 65, 67, 69, 71, 72]  # C, D, E, F, G, A, B, C
velocity = 80

for note in notes:
    track.append(Message('note_on', note=note, velocity=velocity, time=0))
    track.append(Message('note_off', note=note, velocity=velocity, time=480))  # 480 ticks = quarter note

# Add end of track
track.append(mido.MetaMessage('end_of_track', time=0))

# Save the MIDI file
mid.save('midi_files/sample.mid')
print("Sample MIDI file created: midi_files/sample.mid")
