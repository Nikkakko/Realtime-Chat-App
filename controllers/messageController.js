import asyncHandler from 'express-async-handler';
import Chat from '../Models/chatModel.js';
import Message from '../Models/messageModal.js';

export const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    res.status(400);
    throw new Error('Invalid data');
  }

  const newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
    let message = await Message.create(newMessage);
    message = await message.populate('sender', 'name pic');
    message = await message.populate('chat');
    message = await Message.populate(message, { path: 'chat.users' });

    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(400);
    throw new Error('Invalid data');
  }
});

export const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name pic email')
      .populate('chat');

    res.status(200).json(messages);
  } catch (error) {
    res.status(400);
    throw new Error('Invalid data');
  }
});
