const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 7860;

// Middleware (HuggingFace compatible)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(".")); // Serve everything from root directory

// ADDED: Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ADDED: Serve admin.html for /admin route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads (same as working example)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'package-' + uniqueSuffix + extension);
    },
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed!"), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

// In-memory storage
let packages = [];
let adminCode = "yv6BZQUn9uKt";

// Status configurations
const statusConfig = {
    'Pending': {
        location: 'Origin Facility',
        description: 'Package is pending processing'
    },
    'Shipped': {
        location: 'Shipping Facility',
        description: 'Package has been shipped and is awaiting processing'
    },
    'In Transit': {
        location: 'Distribution Center',
        description: 'Package is moving through network'
    },
    'On Hold': {
        location: 'Distribution Center',
        description: 'Package is temporarily on hold pending additional information'
    },
    'Out for Delivery': {
        location: 'Local Facility',
        description: 'Package is out for delivery today'
    },
    'Delivered': {
        location: 'Destination',
        description: 'Package delivered to recipient'
    }
};

// Generate tracking number
function generateTrackingNumber() {
    return 'DHL' + Date.now().toString().slice(-9) + Math.random().toString(36).substr(2, 3).toUpperCase();
}

// Routes

// Serve uploads directory
app.use("/uploads", express.static("uploads"));

// Health check endpoint (HuggingFace compatible)
app.get("/api/health", (req, res) => {
    res.json({ 
        status: "OK", 
        timestamp: new Date().toISOString(),
        packagesCount: packages.length,
        storage: "memory"
    });
});

// Admin authentication
app.post('/api/admin/login', (req, res) => {
    const { code } = req.body;
    console.log('Admin login attempt with code:', code);
    
    if (code === adminCode) {
        res.json({ success: true, message: 'Authentication successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid authorization code' });
    }
});

// Get all packages
app.get('/api/packages', (req, res) => {
    console.log('GET /api/packages - Returning', packages.length, 'packages');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json(packages);
});

// Get package by tracking number
app.get('/api/packages/track/:trackingNumber', (req, res) => {
    const { trackingNumber } = req.params;
    console.log('Tracking package:', trackingNumber);
    
    const package = packages.find(pkg => pkg.trackingNumber === trackingNumber);
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    if (!package) {
        return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    res.json({ success: true, package });
});

// Create new package (supports both file upload and image URL)
app.post('/api/packages', upload.single('image'), (req, res) => {
    try {
        console.log('POST /api/packages - Received request body:', req.body);

        const { 
            senderName, 
            recipientName, 
            recipientAddress, 
            packageDescription, 
            weight,
            trackingNumber: providedTrackingNumber,
            imageUrl
        } = req.body;

        // FIXED: Removed dimensions from required fields
        // Validate required fields
        if (!senderName || !recipientName || !packageDescription || !weight) {
            return res.status(400).json({ 
                success: false, 
                message: 'All required fields must be filled' 
            });
        }

        // Generate tracking number if not provided
        const trackingNumber = providedTrackingNumber || generateTrackingNumber();
        
        // Check if tracking number already exists
        if (packages.find(pkg => pkg.trackingNumber === trackingNumber)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tracking number already exists' 
            });
        }
        
        // Handle image - either uploaded file or provided URL
        let finalImageUrl = null;
        if (req.file) {
            // Use uploaded file
            finalImageUrl = `/uploads/${req.file.filename}`;
        } else if (imageUrl && imageUrl.trim() !== '') {
            // Use provided image URL
            finalImageUrl = imageUrl;
        }

        const newPackage = {
            id: uuidv4(),
            trackingNumber,
            senderName,
            recipientName,
            recipientAddress: recipientAddress || 'Not specified',
            packageDescription,
            weight: parseFloat(weight),
            dimensions: 'Not specified', // FIXED: Default value since field is removed
            imageUrl: finalImageUrl,
            status: 'Pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            history: [
                {
                    status: 'Pending',
                    location: statusConfig['Pending'].location,
                    timestamp: new Date().toISOString(),
                    description: statusConfig['Pending'].description
                }
            ]
        };

        packages.push(newPackage);
        
        console.log('New package created:', trackingNumber, 'Total packages:', packages.length);
        res.json({ 
            success: true, 
            package: newPackage,
            message: 'Package created successfully!' 
        });
    } catch (error) {
        console.error('Error creating package:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error: ' + error.message 
        });
    }
});

// Update package status
app.put('/api/packages/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`Updating package ${id} status to:`, status);

    const packageIndex = packages.findIndex(pkg => pkg.id === id);
    if (packageIndex === -1) {
        return res.status(404).json({ 
            success: false, 
            message: 'Package not found' 
        });
    }

    if (!statusConfig[status]) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid status' 
        });
    }

    const oldStatus = packages[packageIndex].status;
    packages[packageIndex].status = status;
    packages[packageIndex].updatedAt = new Date().toISOString();
    
    // Add to history
    packages[packageIndex].history.unshift({
        status,
        location: statusConfig[status].location,
        timestamp: new Date().toISOString(),
        description: statusConfig[status].description
    });

    console.log(`Package ${packages[packageIndex].trackingNumber} status updated: ${oldStatus} -> ${status}`);
    
    res.json({ 
        success: true, 
        package: packages[packageIndex],
        message: `Status updated to ${status}` 
    });
});

// Delete package
app.delete('/api/packages/:id', (req, res) => {
    const { id } = req.params;
    console.log('Deleting package:', id);

    const packageIndex = packages.findIndex(pkg => pkg.id === id);
    
    if (packageIndex === -1) {
        return res.status(404).json({ 
            success: false, 
            message: 'Package not found' 
        });
    }

    const packageToDelete = packages[packageIndex];
    
    // Delete associated image file if it was uploaded (not a URL)
    if (packageToDelete.imageUrl && packageToDelete.imageUrl.startsWith('/uploads/')) {
        const imagePath = path.join(__dirname, packageToDelete.imageUrl);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log('Deleted image file:', imagePath);
        }
    }

    packages.splice(packageIndex, 1);
    
    console.log('Package deleted:', packageToDelete.trackingNumber, 'Total packages:', packages.length);
    res.json({ 
        success: true, 
        message: 'Package deleted successfully' 
    });
});

// Get package by ID
app.get('/api/packages/:id', (req, res) => {
    const { id } = req.params;
    const package = packages.find(pkg => pkg.id === id);
    
    if (!package) {
        return res.status(404).json({ 
            success: false, 
            message: 'Package not found' 
        });
    }
    
    res.json({ success: true, package });
});

// Get package statistics
app.get('/api/statistics', (req, res) => {
    const totalPackages = packages.length;
    const statusCounts = packages.reduce((acc, pkg) => {
        acc[pkg.status] = (acc[pkg.status] || 0) + 1;
        return acc;
    }, {});

    res.json({
        success: true,
        statistics: {
            totalPackages,
            statusCounts,
            packagesCreatedToday: packages.filter(pkg => {
                const today = new Date().toDateString();
                return new Date(pkg.createdAt).toDateString() === today;
            }).length
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
    }
    
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Start server (HuggingFace compatible)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DHL Shipping Server running on port ${PORT}`);
    console.log(`📁 Uploads directory: ${uploadsDir}`);
    console.log(`🔑 Admin Code: ${adminCode}`);
    console.log(`📊 Starting with ${packages.length} packages in memory`);
    console.log(`🌐 Main Website: http://localhost:${PORT}`);
    console.log(`📦 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
    console.log('✅ Server is ready for HuggingFace Space!');
});

// Export for testing
module.exports = app;
