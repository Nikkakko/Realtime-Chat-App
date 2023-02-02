import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { chats } from './data/data.js';
import connectDB from './config/db.js';
import colors from 'colors';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

dotenv.config();
connectDB();
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`${chats}`);
});

app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/messages', messageRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`.green.bold);
});

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: '*',
  },
});

io.on('connection', socket => {
  socket.on('setup', userData => {
    socket.join(userData._id);
    socket.emit('connected');
  });

  socket.on('join chat', room => {
    socket.join(room);
  });

  socket.on('typing', room => socket.in(room).emit('typing'));
  socket.on('stop typing', room => socket.in(room).emit('stop typing'));

  socket.on('new message', newMessageRecieved => {
    const chat = newMessageRecieved.chat;

    if (!chat.users) return console.log('Chat.users not defined');

    chat.users.forEach(user => {
      if (user._id == newMessageRecieved.sender._id) return;
      socket.in(user._id).emit('message recieved', newMessageRecieved);
    });
  });

  socket.off('setup', () => {
    socket.leave(userData._id);
  });
});
