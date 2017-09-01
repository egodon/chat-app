const Mustache = require('mustache');
const io = require('socket.io-client');
const client = io();
const {commandsList, commandsPrint} = require('./modules/commands');
const moment = require('moment');

// CSS
import '../css/global-styles.css';
import '../css/chat-styles.css';

// JS
import scrollToBottom from './modules/scrollToBottom';
import destroyRoom from './modules/destroyRoom';
import './libs/deparam';



client.on('connect', () => {
    const params = jQuery.deparam(window.location.search);

    client.emit('join', params, (err) => {
        if (err){
            alert(err);
            window.location.href = '/'
        } else {
            console.log('No errors');
        }
    });

    $('#message-form').on('submit', (e) => {
        e.preventDefault();
        var $messageTextbox = $('[name=message]');
        var messageInput = $messageTextbox.val().toString();


		// Checking if message is a command
        if (messageInput in commandsList) {
            var popout = '';
			switch(messageInput){
                case '/commands':
                    popout = commandsPrint;
                    break;
                case '/printRooms':
                    client.on('roomNames', (roomNames) => {
                        popout = roomNames;
                    });
                    client.emit('printRooms');
                    break;
                case '/deleteRoom':
                    destroyRoom();
                    break;
            }
		} else {
			client.emit('createMessage', {
				text: $messageTextbox.val()
			});
		}
		$messageTextbox.val('');
    });

    $('#leave-room-btn').on('click', () => {
        window.location.href = '/';
    });

});

client.on('disconnect', () => {
    console.log('Disconnected from server')
});

client.on('updateUserList', (users) => {
    const ul = $('<ul></ul>');
    users.forEach((user) => {
        const span = $('<span class="user-colour"></span>')
                        .css('background', user.colour);
        ul.append($(`<li>${user.name}</li>`)
           .append(span));
    });
    $('#users').html(ul);
});

client.on('fillRoomWithMessages', (messages) => {
    const template = $('#message-template').html();
    messages.forEach((message) => {
        const timeFromNow = moment(message.createdAt).fromNow();
        const html = Mustache.render(template, {
            from: message.from,
            text: message.text,
            createdAt: timeFromNow
        });

        $('#messages').append(html);
        $('.message-colour:last').css({"background": message.colour })
        scrollToBottom();
    })
});

// Admin messages
client.on('adminMessage', (message) => {
    const template = $('#message-template').html();
    const html = Mustache.render(template, {
        text: message.text,
        createdAt: message.createdAt
    });

    $('#messages').append(html);
    scrollToBottom();
});


client.on('newMessage', (message) => {
    const formattedTime = moment(message.createdAt).format('h:mm a');
    const template = $('#message-template').html();
    const html = Mustache.render(template, {
        text: message.text,
        from: message.from,
        createdAt: formattedTime
    });

    $('#messages').append(html);
    $('.message-colour:last').css({"background": message.colour })
    scrollToBottom();

});




