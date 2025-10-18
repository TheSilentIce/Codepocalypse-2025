from flask import Flask, jsonify, request

app = Flask(__name__)


@app.route('/')
def home():
    return jsonify({
        'message': 'Hello from Flask!',
        'status': 'running'
    })


@app.route('/api/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'backend'
    })


@app.route('/api/echo', methods=['POST'])
def echo():
    data = request.get_json()
    return jsonify({
        'received': data
    })


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
