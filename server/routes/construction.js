const express = require("express");
const router = express.Router();
const db = require("../db/connection");

/* ============================================================
   DASHBOARD STATS
============================================================ */

router.get("/stats", (req, res) => {
  const queries = [
    new Promise((resolve, reject) => {
      db.query(
        "SELECT COUNT(*) AS cnt FROM construction_projects WHERE status='active'",
        (e, r) => (e ? reject(e) : resolve(r[0].cnt))
      );
    }),
    new Promise((resolve, reject) => {
      db.query(
        "SELECT COUNT(*) AS cnt FROM construction_projects",
        (e, r) => (e ? reject(e) : resolve(r[0].cnt))
      );
    }),
    new Promise((resolve, reject) => {
      db.query(
        "SELECT COALESCE(SUM(total_quantity),0) AS total FROM construction_inventory",
        (e, r) => (e ? reject(e) : resolve(r[0].total))
      );
    }),
    new Promise((resolve, reject) => {
      db.query(
        "SELECT COUNT(*) AS cnt FROM construction_inventory WHERE available_qty <= reorder_level AND reorder_level > 0",
        (e, r) => (e ? reject(e) : resolve(r[0].cnt))
      );
    }),
    new Promise((resolve, reject) => {
      db.query(
        "SELECT COUNT(*) AS cnt FROM construction_workers WHERE status='active'",
        (e, r) => (e ? reject(e) : resolve(r[0].cnt))
      );
    }),
    new Promise((resolve, reject) => {
      db.query(
        "SELECT COALESCE(SUM(budget),0) AS total FROM construction_projects",
        (e, r) => (e ? reject(e) : resolve(r[0].total))
      );
    }),
  ];

  Promise.all(queries)
    .then(([active_projects, total_projects, total_materials, low_stock, active_workers, total_budget]) => {
      res.json({ active_projects, total_projects, total_materials, low_stock, active_workers, total_budget });
    })
    .catch((e) => res.status(500).json(e));
});

/* ============================================================
   PROJECTS
============================================================ */

router.get("/projects", (req, res) => {
  const sql = `
    SELECT p.*, u.name AS created_by_name
    FROM construction_projects p
    LEFT JOIN users u ON p.created_by = u.id
    ORDER BY p.created_at DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.get("/projects/:id", (req, res) => {
  const id = req.params.id;

  const projectSql = `
    SELECT p.*, u.name AS created_by_name
    FROM construction_projects p
    LEFT JOIN users u ON p.created_by = u.id
    WHERE p.id = ?
  `;
  db.query(projectSql, [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result.length) return res.status(404).json({ message: "Project not found" });

    const project = result[0];

    Promise.all([
      new Promise((resolve, reject) => {
        db.query(
          `SELECT ci.*, inv.item_name, inv.unit
           FROM construction_issues ci
           JOIN construction_inventory inv ON ci.item_id = inv.id
           WHERE ci.project_id = ?
           ORDER BY ci.issue_date DESC`,
          [id],
          (e, r) => (e ? reject(e) : resolve(r))
        );
      }),
      new Promise((resolve, reject) => {
        db.query(
          `SELECT cp.*, inv.item_name, inv.unit
           FROM construction_purchases cp
           JOIN construction_inventory inv ON cp.item_id = inv.id
           WHERE cp.project_id = ?
           ORDER BY cp.purchase_date DESC`,
          [id],
          (e, r) => (e ? reject(e) : resolve(r))
        );
      }),
    ])
      .then(([issues, purchases]) => {
        res.json({ project, issues, purchases });
      })
      .catch((e) => res.status(500).json(e));
  });
});

router.post("/projects", (req, res) => {
  const {
    project_name, project_code, description, location,
    start_date, end_date, budget, contractor,
    project_manager, status, created_by
  } = req.body;

  if (!project_name) return res.status(400).json({ message: "Project name is required" });

  const sql = `
    INSERT INTO construction_projects
    (project_name, project_code, description, location,
     start_date, end_date, budget, contractor,
     project_manager, status, created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `;
  db.query(
    sql,
    [
      project_name, project_code || null, description, location,
      start_date || null, end_date || null, budget || null, contractor,
      project_manager, status || "planning", created_by || null
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Project created", id: result.insertId });
    }
  );
});

router.put("/projects/:id", (req, res) => {
  const {
    project_name, description, location, start_date,
    end_date, budget, contractor, project_manager, status
  } = req.body;

  const sql = `
    UPDATE construction_projects SET
    project_name=?, description=?, location=?, start_date=?,
    end_date=?, budget=?, contractor=?, project_manager=?, status=?
    WHERE id=?
  `;
  db.query(
    sql,
    [project_name, description, location, start_date || null,
     end_date || null, budget || null, contractor, project_manager, status, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Project updated" });
    }
  );
});

/* ============================================================
   INVENTORY (MATERIALS)
============================================================ */

router.get("/inventory", (req, res) => {
  const sql = `
    SELECT i.*, c.name AS category_name
    FROM construction_inventory i
    LEFT JOIN construction_categories c ON i.category_id = c.id
    ORDER BY i.item_name
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post("/inventory", (req, res) => {
  const {
    category_id, item_name, brand, unit,
    total_quantity, available_qty, reorder_level,
    unit_cost, storage_location, supplier, last_purchase
  } = req.body;

  if (!item_name) return res.status(400).json({ message: "Item name required" });

  const sql = `
    INSERT INTO construction_inventory
    (category_id, item_name, brand, unit,
     total_quantity, available_qty, reorder_level,
     unit_cost, storage_location, supplier, last_purchase)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `;
  db.query(
    sql,
    [
      category_id || null, item_name, brand, unit,
      total_quantity || 0, available_qty || 0, reorder_level || 0,
      unit_cost || null, storage_location, supplier, last_purchase || null
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Item added to inventory", id: result.insertId });
    }
  );
});

router.put("/inventory/:id", (req, res) => {
  const {
    item_name, brand, unit, reorder_level,
    unit_cost, storage_location, supplier
  } = req.body;

  const sql = `
    UPDATE construction_inventory SET
    item_name=?, brand=?, unit=?, reorder_level=?,
    unit_cost=?, storage_location=?, supplier=?
    WHERE id=?
  `;
  db.query(
    sql,
    [item_name, brand, unit, reorder_level || 0,
     unit_cost || null, storage_location, supplier, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Item updated" });
    }
  );
});

router.get("/categories", (req, res) => {
  db.query("SELECT * FROM construction_categories ORDER BY name", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

/* ============================================================
   PURCHASES (STOCK IN)
============================================================ */

router.get("/purchases", (req, res) => {
  const sql = `
    SELECT cp.*, inv.item_name, inv.unit, p.project_name
    FROM construction_purchases cp
    JOIN construction_inventory inv ON cp.item_id = inv.id
    LEFT JOIN construction_projects p ON cp.project_id = p.id
    ORDER BY cp.purchase_date DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post("/purchases", (req, res) => {
  const {
    project_id, item_id, quantity, unit_cost,
    supplier, invoice_number, purchase_date, received_by, notes
  } = req.body;

  const total_cost = (parseFloat(quantity) || 0) * (parseFloat(unit_cost) || 0);

  const sql = `
    INSERT INTO construction_purchases
    (project_id, item_id, quantity, unit_cost, total_cost,
     supplier, invoice_number, purchase_date, received_by, notes)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `;
  db.query(
    sql,
    [
      project_id || null, item_id, quantity, unit_cost || null,
      total_cost, supplier, invoice_number, purchase_date,
      received_by || null, notes
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);

      // Update inventory quantities
      const qty = parseFloat(quantity) || 0;
      db.query(
        `UPDATE construction_inventory
         SET total_quantity = total_quantity + ?,
             available_qty = available_qty + ?,
             last_purchase = ?,
             unit_cost = COALESCE(?, unit_cost)
         WHERE id = ?`,
        [qty, qty, purchase_date, unit_cost || null, item_id],
        () => {}
      );

      // Update project spent
      if (project_id && total_cost) {
        db.query(
          "UPDATE construction_projects SET spent = spent + ? WHERE id = ?",
          [total_cost, project_id],
          () => {}
        );
      }

      res.json({ message: "Purchase recorded", id: result.insertId });
    }
  );
});

/* ============================================================
   ISSUES (STOCK OUT / MATERIAL USAGE)
============================================================ */

router.get("/issues", (req, res) => {
  const sql = `
    SELECT ci.*, inv.item_name, inv.unit, p.project_name
    FROM construction_issues ci
    JOIN construction_inventory inv ON ci.item_id = inv.id
    LEFT JOIN construction_projects p ON ci.project_id = p.id
    ORDER BY ci.issue_date DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post("/issues", (req, res) => {
  const {
    project_id, item_id, quantity,
    issued_to, purpose, issue_date, issued_by, notes
  } = req.body;

  const sql = `
    INSERT INTO construction_issues
    (project_id, item_id, quantity, issued_to, purpose, issue_date, issued_by, notes)
    VALUES (?,?,?,?,?,?,?,?)
  `;
  db.query(
    sql,
    [project_id || null, item_id, quantity, issued_to, purpose, issue_date, issued_by || null, notes],
    (err, result) => {
      if (err) return res.status(500).json(err);

      // Deduct from inventory
      const qty = parseFloat(quantity) || 0;
      db.query(
        "UPDATE construction_inventory SET available_qty = available_qty - ? WHERE id = ? AND available_qty >= ?",
        [qty, item_id, qty],
        () => {}
      );

      res.json({ message: "Material issued", id: result.insertId });
    }
  );
});

/* Return material */
router.post("/issues/return/:id", (req, res) => {
  const id = req.params.id;
  const { returned_qty, return_date } = req.body;

  db.query(
    "UPDATE construction_issues SET returned_qty=?, return_date=? WHERE id=?",
    [returned_qty, return_date, id],
    (err) => {
      if (err) return res.status(500).json(err);

      db.query("SELECT item_id FROM construction_issues WHERE id=?", [id], (e, r) => {
        if (r && r.length) {
          db.query(
            "UPDATE construction_inventory SET available_qty = available_qty + ? WHERE id=?",
            [parseFloat(returned_qty) || 0, r[0].item_id],
            () => {}
          );
        }
      });

      res.json({ message: "Material return recorded" });
    }
  );
});

/* ============================================================
   WORKERS
============================================================ */

router.get("/workers", (req, res) => {
  db.query(
    "SELECT * FROM construction_workers ORDER BY name",
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
});

router.post("/workers", (req, res) => {
  const {
    name, worker_id, trade, phone, aadhar,
    address, contractor, daily_rate, joined_date
  } = req.body;

  if (!name) return res.status(400).json({ message: "Worker name required" });

  const sql = `
    INSERT INTO construction_workers
    (name, worker_id, trade, phone, aadhar, address, contractor, daily_rate, joined_date)
    VALUES (?,?,?,?,?,?,?,?,?)
  `;
  db.query(
    sql,
    [name, worker_id || null, trade || "helper", phone, aadhar, address, contractor, daily_rate || null, joined_date || null],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Worker added", id: result.insertId });
    }
  );
});

router.put("/workers/:id", (req, res) => {
  const { name, trade, phone, contractor, daily_rate, status } = req.body;
  db.query(
    "UPDATE construction_workers SET name=?, trade=?, phone=?, contractor=?, daily_rate=?, status=? WHERE id=?",
    [name, trade, phone, contractor, daily_rate || null, status || "active", req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Worker updated" });
    }
  );
});

/* ============================================================
   ATTENDANCE
============================================================ */

router.get("/attendance", (req, res) => {
  const { date, project_id } = req.query;
  let sql = `
    SELECT a.*, w.name AS worker_name, w.trade, p.project_name
    FROM construction_attendance a
    JOIN construction_workers w ON a.worker_id = w.id
    LEFT JOIN construction_projects p ON a.project_id = p.id
    WHERE 1=1
  `;
  const params = [];
  if (date) { sql += " AND a.work_date = ?"; params.push(date); }
  if (project_id) { sql += " AND a.project_id = ?"; params.push(project_id); }
  sql += " ORDER BY a.work_date DESC, w.name";

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post("/attendance", (req, res) => {
  const { project_id, worker_id, work_date, shift, amount_paid, recorded_by, notes } = req.body;

  const sql = `
    INSERT INTO construction_attendance
    (project_id, worker_id, work_date, shift, amount_paid, recorded_by, notes)
    VALUES (?,?,?,?,?,?,?)
  `;
  db.query(
    sql,
    [project_id || null, worker_id, work_date, shift || "full", amount_paid || null, recorded_by || null, notes],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Attendance recorded", id: result.insertId });
    }
  );
});

/* ============================================================
   EQUIPMENT (MACHINERY)
============================================================ */

router.get("/equipment", (req, res) => {
  db.query(
    "SELECT * FROM construction_equipment ORDER BY equipment_name",
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
});

router.post("/equipment", (req, res) => {
  const {
    equipment_name, equipment_code, category, brand,
    model, owned_rented, rental_rate, status,
    last_service, next_service, notes
  } = req.body;

  if (!equipment_name) return res.status(400).json({ message: "Equipment name required" });

  const sql = `
    INSERT INTO construction_equipment
    (equipment_name, equipment_code, category, brand,
     model, owned_rented, rental_rate, status, last_service, next_service, notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `;
  db.query(
    sql,
    [
      equipment_name, equipment_code || null, category || "other", brand,
      model, owned_rented || "owned", rental_rate || null,
      status || "available", last_service || null, next_service || null, notes
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Equipment added", id: result.insertId });
    }
  );
});

router.put("/equipment/:id", (req, res) => {
  const { status, last_service, next_service, notes } = req.body;
  db.query(
    "UPDATE construction_equipment SET status=?, last_service=?, next_service=?, notes=? WHERE id=?",
    [status, last_service || null, next_service || null, notes, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Equipment updated" });
    }
  );
});

module.exports = router;
