from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app)

# Maintain a list of drawing data
drawing_data = []
# Maintain a list of connected users
connected_users = {}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('draw')
def handle_draw(data):
    drawing_data.append(data)
    socketio.emit('draw', data)

@socketio.on('clear')
def handle_clear():
    drawing_data.clear()
    socketio.emit('clear')

@socketio.on('get_initial_data')
def send_initial_data():
    # Send the initial drawing data to a new client
    for data in drawing_data:
        emit('draw', data)

@socketio.on('connect')
def handle_connect():
    # Send the initial drawing data to a new client upon connection
    send_initial_data()
    # Handle setting username
    emit('set_username', broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    if request.sid in connected_users:
        username = connected_users[request.sid]
        del connected_users[request.sid]
        emit('update_users', list(connected_users.values()), broadcast=True)
        print(f"User {username} disconnected")

@socketio.on('set_username')
def set_username(username):
    connected_users[request.sid] = username
    emit('update_users', list(connected_users.values()), broadcast=True)

@socketio.on('get_user_list')
def get_user_list():
    emit('user_list', list(connected_users.values()))

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0')
