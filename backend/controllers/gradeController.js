const Grade = require("../models/Grade");

exports.createGrade = async (req, res) => {
  try {
    const grade = new Grade(req.body);
    await grade.save();
    res.status(201).json({ success: true, grade });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getGrades = async (req, res) => {
  try {
    const grades = await Grade.find()
      .populate("student", "name email")
      .populate("assignment", "title")
      .lean();
    res.json({ success: true, grades });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMyGrades = async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.user._id })
      .populate("assignment", "title dueDate")
      .populate({
        path: "assignment",
        populate: { path: "course", select: "title" },
      })
      .lean();
    res.json({ success: true, grades });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const { score, feedback } = req.body;
    const grade = new Grade({
      student: req.body.student,
      assignment: req.params.submissionId,
      score,
      feedback,
    });
    await grade.save();
    res.status(201).json({ success: true, grade });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateGrade = async (req, res) => {
  try {
    const grade = await Grade.findOneAndUpdate(
      { assignment: req.params.submissionId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!grade) {
      return res.status(404).json({ success: false, error: "Grade not found" });
    }

    res.json({ success: true, grade });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
