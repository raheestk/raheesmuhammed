const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'uploads/';
        if (req.baseUrl.includes('employees')) folder += 'employees';
        else if (req.baseUrl.includes('company')) folder += 'company';
        else if (req.baseUrl.includes('vehicles')) folder += 'vehicles';
        else if (req.baseUrl.includes('cheques')) folder += 'cheques';
        
        // Custom folder routing check for photos
        if (file.fieldname === 'photo' && req.baseUrl.includes('employees')) folder += '/photos';
        if (file.fieldname === 'photo' && req.baseUrl.includes('vehicles')) folder += '/photos';
        
        const fullPath = path.join(__dirname, '..', folder);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
        cb(null, fullPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});

module.exports = multer({ storage });
