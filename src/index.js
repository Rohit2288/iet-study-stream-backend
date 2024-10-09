require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Import routes and middleware
const authRoutes = require('./routes/auth');
const paperRoutes = require('./routes/papers');
const chatRoutes = require('./routes/chat');
const { authenticateToken } = require('./middleware/auth');
const upload = require('./middleware/upload');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const prisma = new PrismaClient();

// Create uploads directory if it doesn't exist
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Basic middleware
app.use(express.json());

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = ['https://iet-study-stream.netlify.app'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

// Serve static files from the uploads directory
// Make sure this path matches the upload destination in upload middleware
app.use('/uploads', express.static(uploadsPath));

// Socket.IO Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = decoded;
    next();
  });
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.user.email);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const message = await prisma.message.create({
        data: {
          content: data.content,
          senderId: data.sender,
          roomId: data.roomId
        },
        include: {
          sender: true
        }
      });
      io.to(data.roomId).emit('message', message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user.email);
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/chat', chatRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large' });
    }
    return res.status(400).json({ message: 'File upload error' });
  }
  
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start the server
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const { createServer } = require('http');
// const { Server } = require('socket.io');
// const { PrismaClient } = require('@prisma/client');
// const jwt = require('jsonwebtoken');
// const path = require('path');
// const multer = require('multer');
// const fs = require('fs');

// // Import routes and middleware
// const authRoutes = require('./routes/auth');
// const paperRoutes = require('./routes/papers');
// const chatRoutes = require('./routes/chat');
// const { authenticateToken } = require('./middleware/auth');
// const upload = require('./middleware/upload');

// // Ensure required environment variables are set
// const requiredEnvVars = ['JWT_SECRET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'S3_BUCKET_NAME'];
// for (const envVar of requiredEnvVars) {
//   if (!process.env[envVar]) {
//     console.error(`Error: ${envVar} is not set in environment variables`);
//     process.exit(1);
//   }
// }

// const app = express();
// const httpServer = createServer(app);
// const io = new Server(httpServer, {
//   cors: {
//     origin: process.env.CORS_ORIGIN || 'https://iet-study-stream.netlify.app',
//     methods: ['GET', 'POST'],
//     credentials: true
//   }
// });

// const prisma = new PrismaClient();

// // Basic middleware
// app.use(express.json());

// const corsOptions = {
//   origin: function (origin, callback) {
//     const allowedOrigins = [process.env.CORS_ORIGIN || 'https://iet-study-stream.netlify.app'];
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'), false);
//     }
//   },
//   credentials: true
// };

// app.use(cors(corsOptions));

// // Socket.IO Authentication
// io.use((socket, next) => {
//   const token = socket.handshake.auth.token;
//   if (!token) {
//     return next(new Error('Authentication error'));
//   }

//   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//     if (err) return next(new Error('Authentication error'));
//     socket.user = decoded;
//     next();
//   });
// });

// // Socket.IO Connection Handler
// io.on('connection', (socket) => {
//   console.log('User connected:', socket.user.email);

//   // ... rest of your socket.io logic ...

// });

// // Mount routes
// app.use('/api/auth', authRoutes);
// app.use('/api/papers', paperRoutes);
// app.use('/api/chat', chatRoutes);

// // Global error handling middleware
// app.use((err, req, res, next) => {
//   console.error('Error:', err.message);
//   console.error('Stack:', err.stack);
  
//   if (err instanceof multer.MulterError) {
//     if (err.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({ message: 'File size too large' });
//     }
//     return res.status(400).json({ message: 'File upload error' });
//   }
  
//   res.status(500).json({ message: 'Something went wrong!' });
// });

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({ message: 'Route not found' });
// });

// // Start the server
// const PORT = process.env.PORT || 5001;
// httpServer.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });