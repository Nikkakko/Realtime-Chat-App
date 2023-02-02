import asyncHandler from 'express-async-handler';
import Chat from '../Models/chatModel.js';
import User from '../Models/UserModel.js';

const accesChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400);
    throw new Error('Please provide a valid user id');
  }

  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate('users', '-password')
    .populate('latestMessage');

  isChat = await User.populate(isChat, {
    path: 'latestMessage.sender',
    select: 'name pic email',
  });

  if (isChat.length > 0) {
    res.status(200).send({
      isChat: isChat[0],
    });
  } else {
    let chatData = {
      chatName: 'sender',
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = Chat.findOne({ _id: createdChat._id }).populate(
        'users',
        '-password'
      );

      res.status(200).send(FullChat);
    } catch (error) {
      res.status(400);
      throw new Error('Failed to create the chat');
    }
  }
});

const fetchChats = asyncHandler(async (req, res) => {
  try {
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      .populate('latestMessage')
      .sort({ updatedAt: -1 })
      .then(async results => {
        results = await User.populate(results, {
          path: 'latestMessage.sender',
          select: 'name pic email',
        });
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res
      .status(400)
      .send({ message: 'Please provide all the required fields' });
  }

  const users = JSON.parse(req.body.users);

  if (users.lemgth < 2) {
    return res
      .status(400)
      .send('More than 2 users are required to from a group chat');
  }

  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.status(200).send(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName,
    },
    {
      new: true,
    }
  )
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  if (!updatedChat) {
    res.status(400);
    throw new Error('Failed to update the chat name');
  } else {
    res.status(200).json(updatedChat);
  }
});

const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: {
        users: userId,
      },
    },
    {
      new: true,
    }
  )
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  if (!removed) {
    res.status(400);
    throw new Error('Failed to add the user to the group');
  } else {
    res.status(200).json(removed);
  }
});

const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: {
        users: userId,
      },
    },
    {
      new: true,
    }
  )
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  if (!added) {
    res.status(400);
    throw new Error('Failed to add the user to the group');
  } else {
    res.status(200).json(added);
  }
});

export {
  accesChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  removeFromGroup,
  addToGroup,
};
