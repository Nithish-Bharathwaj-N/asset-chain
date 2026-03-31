const express = require("express");
const router = express.Router();
const db = require("../db/connection");

/* ============================================================
   IT CATEGORIES
============================================================ */

router.get("/categories", (req, res) => {
  db.query("SELECT * FROM it_categories ORDER BY name", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

/* ============================================================
   IT ASSETS — CRUD
============================================================ */

/* GET all assets (with category name) */
router.get("/assets", (req, res) => {
  const sql = `
    SELECT a.*, c.name AS category_name
    FROM it_assets a
    LEFT JOIN it_categories c ON a.category_id = c.id
    ORDER BY a.created_at DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

/* GET single asset with full details */
router.get("/assets/:id", (req, res) => {
  const id = req.params.id;
  const assetSql = `
    SELECT a.*, c.name AS category_name
    FROM it_assets a
    LEFT JOIN it_categories c ON a.category_id = c.id
    WHERE a.id = ?
  `;
  db.query(assetSql, [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result.length) return res.status(404).json({ message: "Asset not found" });

    const asset = result[0];

    Promise.all([
      new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM it_assignments WHERE asset_id=? ORDER BY created_at DESC",
          [id],
          (e, r) => (e ? reject(e) : resolve(r))
        );
      }),
      new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM it_maintenance WHERE asset_id=? ORDER BY maintenance_date DESC",
          [id],
          (e, r) => (e ? reject(e) : resolve(r))
        );
      }),
    ])
      .then(([assignments, maintenance]) => {
        res.json({ asset, assignments, maintenance });
      })
      .catch((e) => res.status(500).json(e));
  });
});

/* ADD asset */
router.post("/assets", (req, res) => {
  const {
    asset_tag, asset_name, category_id, brand, model, serial_number,
    processor, ram_gb, storage_gb, os, ip_address, mac_address,
    location, department, assigned_to, assigned_user_id,
    purchase_date, purchase_cost, vendor_name, warranty_expiry,
    status, condition_grade, notes
  } = req.body;

  if (!asset_tag || !asset_name) {
    return res.status(400).json({ message: "Asset tag and name are required" });
  }

  const sql = `
    INSERT INTO it_assets
    (asset_tag, asset_name, category_id, brand, model, serial_number,
     processor, ram_gb, storage_gb, os, ip_address, mac_address,
     location, department, assigned_to, assigned_user_id,
     purchase_date, purchase_cost, vendor_name, warranty_expiry,
     status, condition_grade, notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;
  db.query(
    sql,
    [
      asset_tag, asset_name, category_id || null, brand, model, serial_number,
      processor, ram_gb || null, storage_gb || null, os, ip_address, mac_address,
      location, department, assigned_to, assigned_user_id || null,
      purchase_date || null, purchase_cost || null, vendor_name, warranty_expiry || null,
      status || "available", condition_grade || "A", notes
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Asset added successfully", id: result.insertId });
    }
  );
});

/* UPDATE asset */
router.put("/assets/:id", (req, res) => {
  const id = req.params.id;
  const {
    asset_name, category_id, brand, model, serial_number,
    processor, ram_gb, storage_gb, os, ip_address, mac_address,
    location, department, assigned_to, assigned_user_id,
    purchase_date, purchase_cost, vendor_name, warranty_expiry,
    status, condition_grade, notes
  } = req.body;

  const sql = `
    UPDATE it_assets SET
    asset_name=?, category_id=?, brand=?, model=?, serial_number=?,
    processor=?, ram_gb=?, storage_gb=?, os=?, ip_address=?, mac_address=?,
    location=?, department=?, assigned_to=?, assigned_user_id=?,
    purchase_date=?, purchase_cost=?, vendor_name=?, warranty_expiry=?,
    status=?, condition_grade=?, notes=?
    WHERE id=?
  `;
  db.query(
    sql,
    [
      asset_name, category_id || null, brand, model, serial_number,
      processor, ram_gb || null, storage_gb || null, os, ip_address, mac_address,
      location, department, assigned_to, assigned_user_id || null,
      purchase_date || null, purchase_cost || null, vendor_name, warranty_expiry || null,
      status, condition_grade, notes, id
    ],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Asset updated" });
    }
  );
});

/* DELETE asset */
router.delete("/assets/:id", (req, res) => {
  db.query("DELETE FROM it_assets WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Asset deleted" });
  });
});

/* DASHBOARD STATS */
router.get("/stats", (req, res) => {
  const queries = [
    new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) AS total FROM it_assets", (e, r) =>
        e ? reject(e) : resolve(r[0].total)
      );
    }),
    new Promise((resolve, reject) => {
      db.query(
        "SELECT COUNT(*) AS cnt FROM it_assets WHERE status='assigned'",
        (e, r) => (e ? reject(e) : resolve(r[0].cnt))
      );
    }),
    new Promise((resolve, reject) => {
      db.query(
        "SELECT COUNT(*) AS cnt FROM it_assets WHERE status='under_repair'",
        (e, r) => (e ? reject(e) : resolve(r[0].cnt))
      );
    }),
    new Promise((resolve, reject) => {
      db.query(
        "SELECT COUNT(*) AS cnt FROM it_assets WHERE status='available'",
        (e, r) => (e ? reject(e) : resolve(r[0].cnt))
      );
    }),
    new Promise((resolve, reject) => {
      db.query(
        "SELECT COUNT(*) AS cnt FROM it_assets WHERE warranty_expiry < CURDATE() AND warranty_expiry IS NOT NULL",
        (e, r) => (e ? reject(e) : resolve(r[0].cnt))
      );
    }),
    new Promise((resolve, reject) => {
      db.query(
        `SELECT c.name AS category, COUNT(*) AS cnt
         FROM it_assets a JOIN it_categories c ON a.category_id=c.id
         GROUP BY c.name ORDER BY cnt DESC LIMIT 6`,
        (e, r) => (e ? reject(e) : resolve(r))
      );
    }),
  ];

  Promise.all(queries)
    .then(([total, assigned, under_repair, available, warranty_expired, by_category]) => {
      res.json({ total, assigned, under_repair, available, warranty_expired, by_category });
    })
    .catch((e) => res.status(500).json(e));
});

/* ============================================================
   IT ASSIGNMENTS
============================================================ */

router.post("/assignments", (req, res) => {
  const {
    asset_id, assigned_to, assigned_user_id,
    department, location, assigned_date, assigned_by, notes
  } = req.body;

  const sql = `
    INSERT INTO it_assignments
    (asset_id, assigned_to, assigned_user_id, department, location, assigned_date, assigned_by, notes)
    VALUES (?,?,?,?,?,?,?,?)
  `;
  db.query(
    sql,
    [asset_id, assigned_to, assigned_user_id || null, department, location, assigned_date, assigned_by || null, notes],
    (err, result) => {
      if (err) return res.status(500).json(err);

      // Update asset status and assignment info
      db.query(
        "UPDATE it_assets SET status='assigned', assigned_to=?, assigned_user_id=?, location=?, department=? WHERE id=?",
        [assigned_to, assigned_user_id || null, location, department, asset_id],
        () => {}
      );

      res.json({ message: "Asset assigned successfully", id: result.insertId });
    }
  );
});

router.post("/assignments/return/:id", (req, res) => {
  const id = req.params.id;
  const { returned_date } = req.body;

  db.query(
    "UPDATE it_assignments SET status='returned', returned_date=? WHERE id=?",
    [returned_date || new Date().toISOString().split("T")[0], id],
    (err) => {
      if (err) return res.status(500).json(err);

      db.query("SELECT asset_id FROM it_assignments WHERE id=?", [id], (e, r) => {
        if (r && r.length) {
          db.query(
            "UPDATE it_assets SET status='available', assigned_to=NULL, assigned_user_id=NULL WHERE id=?",
            [r[0].asset_id],
            () => {}
          );
        }
      });

      res.json({ message: "Asset returned" });
    }
  );
});

/* ============================================================
   IT MAINTENANCE
============================================================ */

router.get("/maintenance", (req, res) => {
  const sql = `
    SELECT m.*, a.asset_name, a.asset_tag
    FROM it_maintenance m
    JOIN it_assets a ON m.asset_id = a.id
    ORDER BY m.maintenance_date DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post("/maintenance", (req, res) => {
  const {
    asset_id, maintenance_type, description, cost,
    vendor_name, technician_name, maintenance_date,
    next_due_date, status, created_by
  } = req.body;

  const sql = `
    INSERT INTO it_maintenance
    (asset_id, maintenance_type, description, cost,
     vendor_name, technician_name, maintenance_date,
     next_due_date, status, created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `;
  db.query(
    sql,
    [
      asset_id, maintenance_type || "repair", description,
      cost || null, vendor_name, technician_name,
      maintenance_date, next_due_date || null,
      status || "completed", created_by || null
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);

      // Update asset status
      if (status === "in_progress" || status === "pending") {
        db.query("UPDATE it_assets SET status='under_repair' WHERE id=?", [asset_id], () => {});
      }

      res.json({ message: "Maintenance record added", id: result.insertId });
    }
  );
});

/* ============================================================
   IT SOFTWARE LICENSES
============================================================ */

router.get("/software", (req, res) => {
  db.query("SELECT * FROM it_software ORDER BY expiry_date ASC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post("/software", (req, res) => {
  const {
    software_name, version, license_key, license_type,
    total_licenses, vendor, purchase_date, expiry_date, cost, assigned_to, notes
  } = req.body;

  const sql = `
    INSERT INTO it_software
    (software_name, version, license_key, license_type,
     total_licenses, vendor, purchase_date, expiry_date, cost, assigned_to, notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `;
  db.query(
    sql,
    [
      software_name, version, license_key, license_type || "perpetual",
      total_licenses || 1, vendor, purchase_date || null,
      expiry_date || null, cost || null, assigned_to, notes
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Software license added", id: result.insertId });
    }
  );
});

router.delete("/software/:id", (req, res) => {
  db.query("DELETE FROM it_software WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Software deleted" });
  });
});

module.exports = router;
