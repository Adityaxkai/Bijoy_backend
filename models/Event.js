import pool from '../config/db.js';

class Event {
    static async create({ image_path, title, comment, date }) {
        const [result] = await pool.query(
            "INSERT INTO operation_bijoy (image_path, title, comment, date) VALUES (?, ?, ?, ?)",
            [image_path, title, comment, date]
        );
        return result;
    }

    static async getAll() {
        const [rows] = await pool.query(
            "SELECT * FROM operation_bijoy ORDER BY date DESC"
        );
        return rows;
    }

    static async getRecent() {
        const [rows] = await pool.query(
            "SELECT * FROM operation_bijoy WHERE created_at > NOW() - INTERVAL 5 SECOND"
        );
        return rows;
    }

    static async delete(id) {
        const [result] = await pool.query(
            "DELETE FROM operation_bijoy WHERE id = ?",
            [id]
        );
        return result;
    }

    static async getImagePath(id) {
        const [rows] = await pool.query(
            "SELECT image_path FROM operation_bijoy WHERE id = ?",
            [id]
        );
        return rows[0]?.image_path;
    }
    static async getById(id) {
        const [rows] = await pool.query(
            "SELECT * FROM operation_bijoy WHERE id = ?",
            [id]
        );
        return rows[0];
    }
}

export default Event;