import { Event } from "../models/models.js";
import asyncHandler from "../utils/asyncHandler.js";

// GET ALL EVENTS
const get_all_events = asyncHandler(async (req, res) => {
  // Fetch events and sort by date descending (newest/upcoming first)
  const events = await Event.find({})
    .sort({ date: -1 })
    // 👇 FIX: Changed "managers" to "createdBy" since managers array was removed
    .populate("createdBy", "username avatarUrl") 
    .lean();

  return res.status(200).json({
    success: true,
    message: "Events fetched successfully",
    events
  });
});

// CREATE EVENT
const create_event = asyncHandler(async (req, res) => {
  const { title, description, date, time, location, category, slug } = req.body;

  // 1. Validate Required Fields
  if (!title || !description || !date || !category || !slug) {
    return res.status(400).json({ 
      success: false, 
      message: "Please fill in all required fields (Title, Slug, Description, Date, Category)" 
    });
  }

  // 2. Check if Slug is Unique
  const existingEvent = await Event.findOne({ slug });
  if (existingEvent) {
    return res.status(400).json({ 
      success: false, 
      message: "This Event URL (slug) is already taken. Please choose another." 
    });
  }

  // 3. Create the Event
  const newEvent = await Event.create({
    title,
    slug,
    description,
    date,
    time,
    location,
    category,
    createdBy: req.user._id, // Assumes authMiddleware has run
    status: "upcoming"
  });

  return res.status(201).json({
    success: true,
    message: "Event created successfully",
    event: newEvent
  });
});

export { get_all_events, create_event };    