import Admission from "../models/admission.js";

export const createAdmission = async (req, res) => {
  try {
    const admissionId = await Admission.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Admission submitted successfully',
      admissionId
    });
  } catch (error) {
    console.error('Error creating admission:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: 'Aadhaar number already exists in our system'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to submit admission'
    });
  }
};

export const getAdmissions = async (req, res) => {
  try {
    const admissions = await Admission.getAll();
    res.json({
      success: true,
      data: admissions
    });
  } catch (error) {
    console.error('Error fetching admissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admissions'
    });
  }
};

export const deleteAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    const affectedRows = await Admission.delete(id);
    
    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Admission not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Admission deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete admission'
    });
  }
};