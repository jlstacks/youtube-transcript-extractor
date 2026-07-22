from flask import Flask, request, jsonify
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
import re
import urllib.parse
import os

app = Flask(__name__)
# Enable CORS so your React frontend can communicate with this backend locally or in production
CORS(app)

def extract_video_id(url_or_id):
    """
    Extracts 11-character YouTube video ID from various YouTube URL formats.
    Supports standard watch links, shortened youtu.be, embeds, shorts, and raw IDs.
    """
    if not url_or_id:
        return None
    
    url_or_id = url_or_id.strip()
    
    # Check if raw 11-character ID
    if len(url_or_id) == 11 and re.match(r'^[a-zA-Z0-9_-]{11}$', url_or_id):
        return url_or_id
        
    # Standard YouTube URLs, Shorts, and Embeds
    regex_patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:embed\/|v\/|shorts\/|youtu\.be\/)([0-9A-Za-z_-]{11})',
        r'^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*'
    ]
    
    for pattern in regex_patterns:
        match = re.search(pattern, url_or_id)
        if match:
            group = match.group(1) if len(match.groups()) == 1 else match.group(2)
            if len(group) == 11:
                return group
                
    return None

def format_timestamp(seconds):
    """Converts seconds into HH:MM:SS or MM:SS format."""
    s = int(seconds)
    hours = s // 3600
    minutes = (s % 3600) // 60
    secs = s % 60
    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"

@app.route('/api/transcript', methods=['POST', 'GET'])
def get_transcript():
    """
    Endpoint to retrieve transcript for a given YouTube URL or Video ID.
    Accepts JSON body: { "url": "https://..." } or query parameter ?url=...
    """
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        url_input = data.get('url') or data.get('videoId')
    else:
        url_input = request.args.get('url') or request.args.get('videoId')

    if not url_input:
        return jsonify({
            'success': False,
            'error': 'Missing required parameter: "url" or "videoId"'
        }), 400

    video_id = extract_video_id(url_input)
    if not video_id:
        return jsonify({
            'success': False,
            'error': 'Invalid YouTube URL or Video ID format'
        }), 400

    try:
        # Fetch transcript using youtube_transcript_api
        # Fetches available languages, preferring English
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Try finding manually created or auto-generated English or fallback transcript
        try:
            transcript = transcript_list.find_transcript(['en', 'en-US', 'en-GB'])
        except Exception:
            # Fallback to any available language
            transcript = next(iter(transcript_list))

        raw_transcript = transcript.fetch()

        formatted_items = []
        full_text_list = []
        srt_lines = []

        for index, item in enumerate(raw_transcript, start=1):
            start = item.get('start', 0)
            duration = item.get('duration', 0)
            text = item.get('text', '').replace('\n', ' ')

            timestamp_str = format_timestamp(start)
            formatted_items.append({
                'id': index,
                'start': round(start, 2),
                'duration': round(duration, 2),
                'timestamp': timestamp_str,
                'text': text
            })
            
            full_text_list.append(f"[{timestamp_str}] {text}")
            
            # SRT subtitle format formatting
            end_time = start + duration
            srt_lines.append(f"{index}\n{format_srt_time(start)} --> {format_srt_time(end_time)}\n{text}\n")

        full_plain_text = " ".join([item['text'] for item in raw_transcript])

        return jsonify({
            'success': True,
            'videoId': video_id,
            'videoUrl': f"https://www.youtube.com/watch?v={video_id}",
            'language': transcript.language,
            'isGenerated': transcript.is_generated,
            'itemCount': len(formatted_items),
            'transcript': formatted_items,
            'fullText': full_plain_text,
            'formattedText': "\n".join(full_text_list),
            'srtText': "\n".join(srt_lines)
        }), 200

    except TranscriptsDisabled:
        return jsonify({
            'success': False,
            'error': 'Transcripts are disabled for this video by the uploader.'
        }), 404
    except NoTranscriptFound:
        return jsonify({
            'success': False,
            'error': 'No transcript or closed captions were found for this video.'
        }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"Failed to retrieve transcript: {str(e)}"
        }), 500

def format_srt_time(seconds):
    """Formats seconds into SRT time code HH:MM:SS,mmm"""
    ms = int((seconds % 1) * 1000)
    s = int(seconds)
    hours = s // 3600
    minutes = (s % 3600) // 60
    secs = s % 60
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'online', 'service': 'YouTube Transcript API'}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Starting YouTube Transcript Extractor API on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)