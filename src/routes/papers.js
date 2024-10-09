const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload'); // Multer middleware

const prisma = new PrismaClient();

// Get all papers
router.get('/', async (req, res) => {
  try {
    const papers = await prisma.paper.findMany({
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        uploadDate: 'desc'
      }
    });
    res.json(papers);
  } catch (error) {
    console.error('Error fetching papers:', error);
    res.status(500).json({ message: 'Error fetching papers' });
  }
});

// Upload new paper (with Multer for file upload)
// router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
//   try {
//     const { title, subject, semester } = req.body;

//     if (!req.file) {
//       return res.status(400).json({ message: 'No file uploaded' });
//     }

//     // Generate full URL for the uploaded file
//      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
//     //const fileUrl = `/uploads/${req.file.filename}`
//     // Save paper details into Prisma
//     const paper = await prisma.paper.create({
//       data: {
//         title,
//         subject,
//         semester: parseInt(semester),
//         fileUrl: fileUrl, // Use the full URL
//         userId: req.user.id // User is retrieved from the authenticated token
//       }
//     });

//     res.status(201).json(paper);
//   } catch (error) {
//     console.error('Error uploading paper:', error);
//     res.status(500).json({ message: 'Error uploading paper' });
//   }
// });
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { title, subject, semester } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // The file URL is now provided by S3
    const fileUrl = req.file.location;

    // Save paper details into Prisma
    const paper = await prisma.paper.create({
      data: {
        title,
        subject,
        semester: parseInt(semester),
        fileUrl: fileUrl,
        userId: req.user.id
      }
    });

    res.status(201).json(paper);
  } catch (error) {
    console.error('Error uploading paper:', error);
    res.status(500).json({ message: 'Error uploading paper' });
  }
});

// Get papers by semester
router.get('/semester/:semester', async (req, res) => {
  try {
    const semester = parseInt(req.params.semester);
    const papers = await prisma.paper.findMany({
      where: { semester },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        uploadDate: 'desc'
      }
    });
    res.json(papers);
  } catch (error) {
    console.error('Error fetching papers:', error);
    res.status(500).json({ message: 'Error fetching papers' });
  }
});

module.exports = router;

