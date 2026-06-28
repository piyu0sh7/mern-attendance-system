const Attendance = require('../models/Attendance');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2-lat1) * (Math.PI/180);
  const dLon = (lon2-lon1) * (Math.PI/180); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in m
}
exports.punchIn = async (req, res) => {
  try {
    const { latitude, longitude, selfie } = req.body;

    if (!selfie) {
      return res.status(400).json({ status: 'fail', message: 'Punch-in selfie is required' });
    }

    if (latitude && longitude && req.user.worksiteLat && req.user.worksiteLon) {
      const distance = getDistanceFromLatLonInM(latitude, longitude, req.user.worksiteLat, req.user.worksiteLon);
      if (distance > req.user.worksiteRadius) {
        return res.status(400).json({ status: 'fail', message: `Geofence block: You are ${Math.round(distance)}m away. Must be within ${req.user.worksiteRadius}m.` });
      }
    }

    let selfieUrl = selfie;
    if (selfie.startsWith('data:image')) {
      const uploadRes = await cloudinary.uploader.upload(selfie, { folder: 'attendance_selfies' });
      selfieUrl = uploadRes.secure_url;
    }

    const attendance = await Attendance.create({
      user: req.user._id,
      punchInTime: new Date(),
      punchInLocation: {
        latitude,
        longitude
      },
      punchInSelfie: selfieUrl,
      status: 'Incomplete' // Will be updated on punch out
    });

    res.status(201).json({
      status: 'success',
      data: {
        attendance
      }
    });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

exports.punchOut = async (req, res) => {
  try {
    const { latitude, longitude, selfie } = req.body;
    const { id } = req.params;

    if (!selfie) {
      return res.status(400).json({ status: 'fail', message: 'Punch-out selfie is required' });
    }

    if (latitude && longitude && req.user.worksiteLat && req.user.worksiteLon) {
      const distance = getDistanceFromLatLonInM(latitude, longitude, req.user.worksiteLat, req.user.worksiteLon);
      if (distance > req.user.worksiteRadius) {
        return res.status(400).json({ status: 'fail', message: `Geofence block: You are ${Math.round(distance)}m away. Must be within ${req.user.worksiteRadius}m.` });
      }
    }

    // Find the specific attendance record to punch out from
    const attendance = await Attendance.findOne({
      _id: id,
      user: req.user._id,
      punchOutTime: { $exists: false }
    });

    if (!attendance) {
      return res.status(404).json({ status: 'fail', message: 'No active punch-in found for this record' });
    }

    let selfieUrl = selfie;
    if (selfie.startsWith('data:image')) {
      const uploadRes = await cloudinary.uploader.upload(selfie, { folder: 'attendance_selfies' });
      selfieUrl = uploadRes.secure_url;
    }

    const punchOutTime = new Date();
    
    // Calculate difference in hours
    const durationMs = punchOutTime - attendance.punchInTime;
    const totalWorkingHours = durationMs / (1000 * 60 * 60);

    // Update status based on >= 8 hours requirement
    const status = totalWorkingHours >= 8 ? 'Completed' : 'Incomplete';

    attendance.punchOutTime = punchOutTime;
    attendance.punchOutLocation = {
      latitude,
      longitude
    };
    attendance.punchOutSelfie = selfieUrl;
    attendance.totalWorkingHours = parseFloat(totalWorkingHours.toFixed(2));
    attendance.status = status;

    await attendance.save();

    res.status(200).json({
      status: 'success',
      data: {
        attendance
      }
    });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const attendances = await Attendance.find({ user: req.user._id })
      .sort('-punchInTime')
      .skip(skip)
      .limit(limit);
      
    const total = await Attendance.countDocuments({ user: req.user._id });
    
    res.status(200).json({
      status: 'success',
      results: attendances.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: {
        attendances
      }
    });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};
