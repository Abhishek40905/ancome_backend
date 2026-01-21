import { Event } from "../models/models.js";
import asyncHandler from "../utils/asyncHandler.js";

const get_all_events = asyncHandler(async (req, res) => {

  const events = await Event.find({})
    .sort({ date: -1 })
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

const edit_event = asyncHandler(async (req, res) => {
    // 1. Get data from body
    const { id, title, slug, description, date, time, location, category, image } = req.body;

    // 2. Validate ID
    if (!id) {
        return res.status(400).json({ message: "Event ID is required for editing" });
    }

    // 3. Find and Update
    // { new: true } returns the updated document instead of the old one
    const updatedEvent = await Event.findByIdAndUpdate(
        id,
        {
            title,
            slug,
            description,
            date,
            time,
            location,
            category,
            image
        },
        { new: true } 
    );

    if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
    }

    return res.status(200).json({
        success: true,
        message: "Event updated successfully",
        event: updatedEvent
    });
});

// --- DELETE EVENT CONTROLLER ---
const delete_event = asyncHandler(async (req, res) => {
    // 1. Get ID (support both body and params just in case)
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: "Event ID is required" });
    }

    // 2. Find and Delete
    const deletedEvent = await Event.findByIdAndDelete(id);

    if (!deletedEvent) {
        return res.status(404).json({ message: "Event not found" });
    }

    return res.status(200).json({
        success: true,
        message: "Event deleted successfully"
    });
});

export { get_all_events, create_event, edit_event, delete_event };    