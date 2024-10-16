// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Create uploads directory if it doesn't exist
// const uploadDir = path.join(__dirname, '../uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const fileFilter = (req, file, cb) => {
//   const allowedTypes = [
//     'image/jpeg',
//     'image/png',
//     'image/gif',
//     'application/pdf',
//     'application/msword',
//     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
//   ];

//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Invalid file type'), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 5 * 1024 * 1024 // 5MB limit
//   }
// });

// module.exports = upload;

// const multer = require('multer');
// const multerS3 = require('multer-s3');
// const { S3Client } = require('@aws-sdk/client-s3');
// const path = require('path');
// const fs = require('fs');

// // Determine if we're using S3 or local storage
// const useS3 = process.env.USE_S3 === 'true';

// let storage;

// if (useS3) {
//   // Configure AWS S3
//   const s3Client = new S3Client({
//     region: process.env.AWS_REGION,
//     credentials: {
//       accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     },
//   });

//   storage = multerS3({
//     s3: s3Client,
//     bucket: process.env.S3_BUCKET_NAME,
//     acl: 'public-read',
//     key: function (req, file, cb) {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//     }
//   });
// } else {
//   // Local storage configuration
//   const uploadsPath = path.join(__dirname, '../uploads');
//   if (!fs.existsSync(uploadsPath)) {
//     fs.mkdirSync(uploadsPath, { recursive: true });
//   }

//   storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, uploadsPath);
//     },
//     filename: function (req, file, cb) {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//     }
//   });
// }

// const upload = multer({
//   storage: storage,
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = [
//       'image/jpeg',
//       'image/png',
//       'image/gif',
//       'application/pdf',
//       'application/msword',
//       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
//     ];

//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Invalid file type'), false);
//     }
//   },
//   limits: {
//     fileSize: 5 * 1024 * 1024 // 5MB limit
//   }
// });

// module.exports = upload;

// 
const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const uploadToSupabase = async (file) => {
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
  const { data, error } = await supabase.storage
    .from('papers')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from('papers')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

module.exports = { upload, uploadToSupabase };



