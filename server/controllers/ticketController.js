const SupportTicket = require('../models/SupportTicket');

// Generate Unique Ticket ID (e.g. TKT-73921)
const generateTicketId = () => {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `TKT-${randomNum}`;
};

// @desc    Raise/Create customer support ticket (Public endpoint for Customer Site)
// @route   POST /api/tickets/create
// @access  Public
const createTicket = async (req, res) => {
  try {
    const {
      customerName,
      phone,
      email,
      subject,
      category,
      orderNumber,
      branch,
      message,
      priority,
    } = req.body;

    if (!customerName || !phone || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide customer name, phone number, subject, and issue details.',
      });
    }

    let ticketId = generateTicketId();
    let existing = await SupportTicket.findOne({ ticketId });
    while (existing) {
      ticketId = generateTicketId();
      existing = await SupportTicket.findOne({ ticketId });
    }

    const ticket = await SupportTicket.create({
      ticketId,
      customerName: customerName.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      subject: subject.trim(),
      category: category || 'General Issue',
      orderNumber: orderNumber ? orderNumber.trim() : '',
      branch: branch || 'All Branches',
      message: message.trim(),
      priority: priority || 'Medium',
      status: 'Open',
    });

    // Notify Owner via Socket.IO
    if (req.io) {
      req.io.to('owner_room').emit('new_support_ticket', {
        message: ` New Support Ticket ${ticket.ticketId} raised by ${ticket.customerName}`,
        ticket,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Support ticket raised successfully. Our team will look into it immediately.',
      data: ticket,
    });
  } catch (error) {
    console.error('[Create Ticket Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating support ticket',
    });
  }
};

// @desc    Get all support tickets (Owner Dashboard)
// @route   GET /api/tickets
// @access  Private / Owner
const getTickets = async (req, res) => {
  try {
    const { status, category, search, priority, page = 1, limit = 50 } = req.query;

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { ticketId: searchRegex },
        { customerName: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { subject: searchRegex },
        { orderNumber: searchRegex },
        { message: searchRegex },
      ];
    }

    const totalTickets = await SupportTicket.countDocuments(query);
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate Summary Stats
    const openCount = await SupportTicket.countDocuments({ status: 'Open' });
    const inProgressCount = await SupportTicket.countDocuments({ status: 'In Progress' });
    const resolvedCount = await SupportTicket.countDocuments({ status: 'Resolved' });
    const closedCount = await SupportTicket.countDocuments({ status: 'Closed' });
    const urgentCount = await SupportTicket.countDocuments({ priority: 'Urgent', status: { $ne: 'Closed' } });

    return res.status(200).json({
      success: true,
      count: tickets.length,
      total: totalTickets,
      page: pageNum,
      pages: Math.ceil(totalTickets / limitNum),
      stats: {
        total: await SupportTicket.countDocuments(),
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        closed: closedCount,
        urgent: urgentCount,
      },
      data: tickets,
    });
  } catch (error) {
    console.error('[Get Tickets Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving tickets',
    });
  }
};

// @desc    Get single ticket details
// @route   GET /api/tickets/:id
// @access  Private / Owner (or Customer lookup)
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    let ticket = null;

    if (id.startsWith('TKT-')) {
      ticket = await SupportTicket.findOne({ ticketId: id });
    } else if (id.match(/^[0-9a-fA-F]{24}$/)) {
      ticket = await SupportTicket.findById(id);
    }

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('[Get Ticket By ID Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching ticket details',
    });
  }
};

// @desc    Update support ticket status / priority / owner notes
// @route   PATCH /api/tickets/:id/status
// @access  Private / Owner
const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, ownerNotes } = req.body;

    let ticket = null;
    if (id.startsWith('TKT-')) {
      ticket = await SupportTicket.findOne({ ticketId: id });
    } else if (id.match(/^[0-9a-fA-F]{24}$/)) {
      ticket = await SupportTicket.findById(id);
    }

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found',
      });
    }

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (ownerNotes !== undefined) ticket.ownerNotes = ownerNotes;

    await ticket.save();

    // Broadcast Socket.IO update
    if (req.io) {
      req.io.to('owner_room').emit('support_ticket_updated', {
        ticketId: ticket.ticketId,
        status: ticket.status,
        priority: ticket.priority,
        ticket,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Ticket ${ticket.ticketId} updated successfully`,
      data: ticket,
    });
  } catch (error) {
    console.error('[Update Ticket Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating ticket',
    });
  }
};

// @desc    Delete support ticket
// @route   DELETE /api/tickets/:id
// @access  Private / Owner
const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    let ticket = null;

    if (id.startsWith('TKT-')) {
      ticket = await SupportTicket.findOneAndDelete({ ticketId: id });
    } else if (id.match(/^[0-9a-fA-F]{24}$/)) {
      ticket = await SupportTicket.findByIdAndDelete(id);
    }

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Support ticket ${ticket.ticketId} deleted successfully`,
    });
  } catch (error) {
    console.error('[Delete Ticket Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting ticket',
    });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  deleteTicket,
};
