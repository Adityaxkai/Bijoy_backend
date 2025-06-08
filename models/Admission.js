// models/admissionModel.js
import pool from '../config/db.js';

class Admission {
  static async create(admissionData) {
    const query = `
      INSERT INTO admissions 
      (student_name, parent_name, address, aadhaar_number, location, institution, course)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      admissionData.studentName,
      admissionData.parentName,
      admissionData.address,
      admissionData.aadhaar,
      admissionData.location,
      admissionData.institution,
      admissionData.course
    ];

    const [result] = await pool.query(query, values);
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await pool.query('SELECT * FROM admissions ORDER BY created_at DESC');
    return rows;
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM admissions WHERE id = ?', [id]);
    return result.affectedRows;
  }
}

export default Admission;