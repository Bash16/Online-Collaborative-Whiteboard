const socket = io.connect('http://' + document.domain + ':' + location.port);
const canvas = document.getElementById('whiteboard');
const context = canvas.getContext('2d');
let drawing = false;
let selectedColor = '#000000';
let username = null;
let touchX, touchY;


socket.on('connect', function () {
    socket.emit('get_initial_data');
});


$("#colorPicker").spectrum({
    preferredFormat: "hex",
    showPalette: true,
    palette: ["#000000", "#FF0000", "#00FF00", "#0000FF"],
    change: function (color) {
        selectedColor = color.toHexString();
    }
});


socket.on('update_users', function (users) {
    const userListDiv = document.getElementById('userList');
    userListDiv.innerHTML = '<b>Users:</b><br>' + users.join('<br>');
});


document.getElementById('setUsernameBtn').addEventListener('click', function () {
    setUsername();
});

function setUsername() {
    username = document.getElementById('username').value;

    console.log('Username set:', username);
    updateUserList();

    socket.emit('set_username', username);
}


canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', draw);


canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);

function startDrawing(e) {
    drawing = true;
    if (e.type === 'mousedown') {
        startX = e.clientX - canvas.getBoundingClientRect().left;
        startY = e.clientY - canvas.getBoundingClientRect().top;
    } else if (e.type === 'touchstart') {
        const touch = e.touches[0];
        startX = touch.clientX - canvas.getBoundingClientRect().left;
        startY = touch.clientY - canvas.getBoundingClientRect().top;
    }
    draw(e);
}

function stopDrawing() {
    drawing = false;
    context.beginPath();
}

function draw(e) {
    if (!drawing || !username) return;

    const x = (e.clientX || e.touches[0].clientX) - canvas.getBoundingClientRect().left;
    const y = (e.clientY || e.touches[0].clientY) - canvas.getBoundingClientRect().top;

    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.lineWidth = 5;
    context.strokeStyle = selectedColor;

    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(x, y);
    context.stroke();
    context.closePath();

    startX = x;
    startY = y;

    const data = {
        x: x / canvas.width,
        y: y / canvas.height,
        color: selectedColor,
        username: username,
    };

    socket.emit('draw', data);
    updateUserList();
}


socket.on('draw', function (data) {
    const x = data.x * canvas.width;
    const y = data.y * canvas.height;

    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.lineWidth = 5;
    context.strokeStyle = data.color;

    context.beginPath();
    context.arc(x, y, 2.5, 0, 2 * Math.PI);
    context.fillStyle = data.color;
    context.fill();
    context.stroke();
});

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clear');
}

socket.on('clear', function () {
    context.clearRect(0, 0, canvas.width, canvas.height);
    updateUserList();
});

function updateUserList() {
    socket.emit('get_user_list');
}

socket.on('user_list', function (users) {
    const userListElement = document.getElementById('userList');
    userListElement.innerHTML = '';

    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user';
        userElement.textContent = user;
        userListElement.appendChild(userElement);
    });
});
