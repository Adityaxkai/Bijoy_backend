import pool from '../config/db.js';

class User {
    static async create({ name, email, password }) {
        const [result] = await pool.query(
            "INSERT INTO signup (name, email, password) VALUES (?, ?, ?)",
            [name, email, password]
        );
        return result;
    }

    static async findByEmail(email) {
        const [rows] = await pool.query(
            "SELECT * FROM signup WHERE email = ?",
            [email]
        );
        return rows[0];
    }

    static async findById(id) {
    const [rows] = await pool.query(
        "SELECT id, name, email, password, is_admin FROM signup WHERE id = ?",
        [id]
    );
    return rows[0];
}

    static async update(id, { name, email }) {
        await pool.query(
            "UPDATE signup SET name = ?, email = ? WHERE Id = ?",
            [name, email, id]
        );
    }

    static async updatePassword(id, hashedPassword) {
        await pool.query(
            "UPDATE signup SET password = ? WHERE Id = ?",
            [hashedPassword, id]
        );
    }
}

export default User;