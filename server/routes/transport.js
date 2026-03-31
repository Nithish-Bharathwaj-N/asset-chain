const express = require("express");
const router = express.Router();
const db = require("../db/connection");

/* ========================================================
   BUSES
======================================================== */

/* GET all buses */
router.get("/buses", (req, res) => {
  const sql = `
    SELECT b.*,
      d.name AS driver_name, d.phone AS driver_phone, d.license_number
    FROM buses b
    LEFT JOIN transport_drivers d ON b.assigned_driver_id = d.id
    ORDER BY b.id DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

/* GET single bus with all related data */
router.get("/buses/:id", (req, res) => {
  const bus_id = req.params.id;
  const sql = `
    SELECT b.*,
      d.name AS driver_name, d.phone AS driver_phone, d.license_number, d.license_expiry
    FROM buses b
    LEFT JOIN transport_drivers d ON b.assigned_driver_id = d.id
    WHERE b.id = ?
  `;
  db.query(sql, [bus_id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result.length) return res.status(404).json({ message: "Bus not found" });

    const bus = result[0];

    // Fetch all related data in parallel via nested queries
    const queries = [
      new Promise((resolve, reject) => {
        db.query("SELECT * FROM rc_book_details WHERE bus_id=?", [bus_id], (e, r) => {
          if (e) reject(e); else resolve(r[0] || null);
        });
      }),
      new Promise((resolve, reject) => {
        db.query("SELECT * FROM bus_insurance WHERE bus_id=? ORDER BY expiry_date DESC", [bus_id], (e, r) => {
          if (e) reject(e); else resolve(r);
        });
      }),
      new Promise((resolve, reject) => {
        db.query("SELECT * FROM bus_fitness_certificate WHERE bus_id=? ORDER BY expiry_date DESC", [bus_id], (e, r) => {
          if (e) reject(e); else resolve(r);
        });
      }),
      new Promise((resolve, reject) => {
        db.query("SELECT * FROM bus_pollution_certificate WHERE bus_id=? ORDER BY expiry_date DESC", [bus_id], (e, r) => {
          if (e) reject(e); else resolve(r);
        });
      }),
      new Promise((resolve, reject) => {
        const rSql = `
          SELECT bra.*, r.route_name, r.route_code, r.start_point, r.end_point
          FROM bus_route_assignments bra
          JOIN bus_routes r ON bra.route_id = r.id
          WHERE bra.bus_id = ?
        `;
        db.query(rSql, [bus_id], (e, r) => {
          if (e) reject(e); else resolve(r);
        });
      }),
      new Promise((resolve, reject) => {
        db.query("SELECT * FROM bus_maintenance WHERE bus_id=? ORDER BY maintenance_date DESC LIMIT 10", [bus_id], (e, r) => {
          if (e) reject(e); else resolve(r);
        });
      }),
    ];

    Promise.all(queries)
      .then(([rc, insurance, fitness, pollution, routes, maintenance]) => {
        res.json({ bus, rc, insurance, fitness, pollution, routes, maintenance });
      })
      .catch((e) => res.status(500).json(e));
  });
});

/* ADD bus */
router.post("/buses", (req, res) => {
  const {
    bus_number, registration_number, vehicle_model, manufacturer,
    year_of_manufacture, seating_capacity, fuel_type, color, status
  } = req.body;

  if (!bus_number || !registration_number) {
    return res.status(400).json({ message: "Bus number and registration number are required" });
  }

  const sql = `
    INSERT INTO buses
      (bus_number, registration_number, vehicle_model, manufacturer,
       year_of_manufacture, seating_capacity, fuel_type, color, status)
    VALUES (?,?,?,?,?,?,?,?,?)
  `;
  db.query(sql, [bus_number, registration_number, vehicle_model, manufacturer,
    year_of_manufacture || null, seating_capacity || 0, fuel_type || "diesel",
    color, status || "active"],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Bus added successfully", id: result.insertId });
    }
  );
});

/* UPDATE bus */
router.put("/buses/:id", (req, res) => {
  const {
    bus_number, registration_number, vehicle_model, manufacturer,
    year_of_manufacture, seating_capacity, fuel_type, color, status, assigned_driver_id
  } = req.body;

  const sql = `
    UPDATE buses SET
      bus_number=?, registration_number=?, vehicle_model=?, manufacturer=?,
      year_of_manufacture=?, seating_capacity=?, fuel_type=?,
      color=?, status=?, assigned_driver_id=?
    WHERE id=?
  `;
  db.query(sql, [bus_number, registration_number, vehicle_model, manufacturer,
    year_of_manufacture || null, seating_capacity || 0, fuel_type || "diesel",
    color, status, assigned_driver_id || null, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Bus updated successfully" });
    }
  );
});

/* DELETE bus */
router.delete("/buses/:id", (req, res) => {
  db.query("DELETE FROM buses WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Bus deleted" });
  });
});


/* ========================================================
   DRIVERS
======================================================== */

router.get("/drivers", (req, res) => {
  db.query("SELECT * FROM transport_drivers ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post("/drivers", (req, res) => {
  const { name, employee_id, phone, email, license_number, license_expiry, address, joined_date } = req.body;
  if (!name) return res.status(400).json({ message: "Driver name is required" });

  const sql = `
    INSERT INTO transport_drivers
      (name, employee_id, phone, email, license_number, license_expiry, address, joined_date)
    VALUES (?,?,?,?,?,?,?,?)
  `;
  db.query(sql, [name, employee_id, phone, email, license_number, license_expiry, address, joined_date],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Driver added successfully", id: result.insertId });
    }
  );
});

router.put("/drivers/:id", (req, res) => {
  const { name, employee_id, phone, email, license_number, license_expiry, address, joined_date, status } = req.body;
  const sql = `
    UPDATE transport_drivers SET
      name=?, employee_id=?, phone=?, email=?, license_number=?,
      license_expiry=?, address=?, joined_date=?, status=?
    WHERE id=?
  `;
  db.query(sql, [name, employee_id, phone, email, license_number, license_expiry, address, joined_date, status, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Driver updated" });
    }
  );
});

router.delete("/drivers/:id", (req, res) => {
  db.query("DELETE FROM transport_drivers WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Driver deleted" });
  });
});


/* ========================================================
   ROUTES
======================================================== */

router.get("/routes", (req, res) => {
  const sql = `
    SELECT r.*,
      COUNT(DISTINCT s.id) AS total_stops
    FROM bus_routes r
    LEFT JOIN route_stops s ON r.id = s.route_id
    GROUP BY r.id
    ORDER BY r.id ASC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.get("/routes/:id", (req, res) => {
  const route_id = req.params.id;
  db.query("SELECT * FROM bus_routes WHERE id=?", [route_id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result.length) return res.status(404).json({ message: "Route not found" });
    const route = result[0];

    db.query("SELECT * FROM route_stops WHERE route_id=? ORDER BY stop_order ASC", [route_id], (err2, stops) => {
      if (err2) return res.status(500).json(err2);

      const busSql = `
        SELECT b.id AS bus_id, b.bus_number, b.registration_number, b.seating_capacity, b.status AS bus_status, bra.shift
        FROM bus_route_assignments bra
        JOIN buses b ON bra.bus_id = b.id
        WHERE bra.route_id = ?
      `;
      db.query(busSql, [route_id], (err3, buses) => {
        if (err3) return res.status(500).json(err3);
        res.json({ route, stops, buses });
      });
    });
  });
});

router.post("/routes", (req, res) => {
  const { route_name, route_code, start_point, end_point, distance_km, estimated_time_min } = req.body;
  if (!route_name) return res.status(400).json({ message: "Route name is required" });

  const sql = `
    INSERT INTO bus_routes (route_name, route_code, start_point, end_point, distance_km, estimated_time_min)
    VALUES (?,?,?,?,?,?)
  `;
  db.query(sql, [route_name, route_code, start_point, end_point, distance_km, estimated_time_min],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Route created successfully", id: result.insertId });
    }
  );
});

router.put("/routes/:id", (req, res) => {
  const { route_name, route_code, start_point, end_point, distance_km, estimated_time_min, status } = req.body;
  const sql = `
    UPDATE bus_routes SET route_name=?, route_code=?, start_point=?, end_point=?,
      distance_km=?, estimated_time_min=?, status=?
    WHERE id=?
  `;
  db.query(sql, [route_name, route_code, start_point, end_point, distance_km, estimated_time_min, status, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Route updated" });
    }
  );
});

router.delete("/routes/:id", (req, res) => {
  db.query("DELETE FROM bus_routes WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Route deleted" });
  });
});


/* ========================================================
   ROUTE STOPS
======================================================== */

router.post("/routes/:route_id/stops", (req, res) => {
  const { stop_name, stop_order, arrival_time } = req.body;
  const sql = "INSERT INTO route_stops (route_id, stop_name, stop_order, arrival_time) VALUES (?,?,?,?)";
  db.query(sql, [req.params.route_id, stop_name, stop_order, arrival_time], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Stop added", id: result.insertId });
  });
});

router.delete("/stops/:id", (req, res) => {
  db.query("DELETE FROM route_stops WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Stop removed" });
  });
});


/* ========================================================
   INSURANCE
======================================================== */

router.get("/insurance", (req, res) => {
  const sql = `
    SELECT i.*, b.bus_number, b.registration_number
    FROM bus_insurance i
    JOIN buses b ON i.bus_id = b.id
    ORDER BY i.expiry_date ASC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post("/insurance", (req, res) => {
  const {
    bus_id, policy_number, insurance_company, policy_type, premium_amount,
    coverage_amount, start_date, expiry_date, agent_name, agent_phone
  } = req.body;

  if (!bus_id || !policy_number || !start_date || !expiry_date) {
    return res.status(400).json({ message: "Bus, policy number, start date and expiry date are required" });
  }

  const sql = `
    INSERT INTO bus_insurance
      (bus_id, policy_number, insurance_company, policy_type, premium_amount,
       coverage_amount, start_date, expiry_date, agent_name, agent_phone)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `;
  db.query(sql, [bus_id, policy_number, insurance_company, policy_type, premium_amount,
    coverage_amount, start_date, expiry_date, agent_name, agent_phone],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Insurance added successfully", id: result.insertId });
    }
  );
});

router.put("/insurance/:id", (req, res) => {
  const {
    policy_number, insurance_company, policy_type, premium_amount,
    coverage_amount, start_date, expiry_date, agent_name, agent_phone, status
  } = req.body;

  const sql = `
    UPDATE bus_insurance SET policy_number=?, insurance_company=?, policy_type=?,
      premium_amount=?, coverage_amount=?, start_date=?, expiry_date=?,
      agent_name=?, agent_phone=?, status=?
    WHERE id=?
  `;
  db.query(sql, [policy_number, insurance_company, policy_type, premium_amount,
    coverage_amount, start_date, expiry_date, agent_name, agent_phone, status, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Insurance updated" });
    }
  );
});


/* ========================================================
   RC BOOK
======================================================== */

router.get("/rc/:bus_id", (req, res) => {
  db.query("SELECT * FROM rc_book_details WHERE bus_id=?", [req.params.bus_id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result[0] || null);
  });
});

router.post("/rc", (req, res) => {
  const {
    bus_id, registration_date, registered_owner, registration_authority,
    rc_expiry_date, hypothecation, gross_vehicle_weight, unladen_weight
  } = req.body;

  if (!bus_id) return res.status(400).json({ message: "Bus ID is required" });

  // Upsert: insert or update
  const checkSql = "SELECT id FROM rc_book_details WHERE bus_id=?";
  db.query(checkSql, [bus_id], (err, existing) => {
    if (err) return res.status(500).json(err);

    if (existing.length) {
      const sql = `
        UPDATE rc_book_details SET registration_date=?, registered_owner=?,
          registration_authority=?, rc_expiry_date=?, hypothecation=?,
          gross_vehicle_weight=?, unladen_weight=?
        WHERE bus_id=?
      `;
      db.query(sql, [registration_date, registered_owner, registration_authority,
        rc_expiry_date, hypothecation, gross_vehicle_weight, unladen_weight, bus_id],
        (err2) => {
          if (err2) return res.status(500).json(err2);
          res.json({ message: "RC Book updated" });
        }
      );
    } else {
      const sql = `
        INSERT INTO rc_book_details
          (bus_id, registration_date, registered_owner, registration_authority,
           rc_expiry_date, hypothecation, gross_vehicle_weight, unladen_weight)
        VALUES (?,?,?,?,?,?,?,?)
      `;
      db.query(sql, [bus_id, registration_date, registered_owner, registration_authority,
        rc_expiry_date, hypothecation, gross_vehicle_weight, unladen_weight],
        (err2, result) => {
          if (err2) return res.status(500).json(err2);
          res.json({ message: "RC Book saved", id: result.insertId });
        }
      );
    }
  });
});


/* ========================================================
   FITNESS CERTIFICATE
======================================================== */

router.get("/fitness", (req, res) => {
  const sql = `
    SELECT f.*, b.bus_number FROM bus_fitness_certificate f
    JOIN buses b ON f.bus_id = b.id
    ORDER BY f.expiry_date ASC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post("/fitness", (req, res) => {
  const { bus_id, certificate_number, issued_by, issued_date, expiry_date, remarks } = req.body;
  const sql = `
    INSERT INTO bus_fitness_certificate (bus_id, certificate_number, issued_by, issued_date, expiry_date, remarks)
    VALUES (?,?,?,?,?,?)
  `;
  db.query(sql, [bus_id, certificate_number, issued_by, issued_date, expiry_date, remarks],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Fitness certificate added", id: result.insertId });
    }
  );
});


/* ========================================================
   POLLUTION CERTIFICATE (PUC)
======================================================== */

router.get("/pollution", (req, res) => {
  const sql = `
    SELECT p.*, b.bus_number FROM bus_pollution_certificate p
    JOIN buses b ON p.bus_id = b.id
    ORDER BY p.expiry_date ASC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post("/pollution", (req, res) => {
  const { bus_id, certificate_number, test_center, test_date, expiry_date, result: testResult } = req.body;
  const sql = `
    INSERT INTO bus_pollution_certificate (bus_id, certificate_number, test_center, test_date, expiry_date, result)
    VALUES (?,?,?,?,?,?)
  `;
  db.query(sql, [bus_id, certificate_number, test_center, test_date, expiry_date, testResult || "pass"],
    (err, r) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "PUC certificate added", id: r.insertId });
    }
  );
});


/* ========================================================
   BUS POINTS (Pass Holders)
======================================================== */

router.get("/bus-points", (req, res) => {
  const sql = `
    SELECT bp.*, r.route_name, r.route_code, s.stop_name
    FROM bus_points bp
    JOIN bus_routes r ON bp.route_id = r.id
    LEFT JOIN route_stops s ON bp.stop_id = s.id
    ORDER BY bp.id DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post("/bus-points", (req, res) => {
  const {
    route_id, stop_id, pass_holder_name, pass_holder_type, roll_number,
    department, phone, pass_valid_from, pass_valid_to
  } = req.body;

  if (!route_id || !pass_holder_name) {
    return res.status(400).json({ message: "Route and name are required" });
  }

  const sql = `
    INSERT INTO bus_points
      (route_id, stop_id, pass_holder_name, pass_holder_type, roll_number,
       department, phone, pass_valid_from, pass_valid_to)
    VALUES (?,?,?,?,?,?,?,?,?)
  `;
  db.query(sql, [route_id, stop_id || null, pass_holder_name, pass_holder_type || "student",
    roll_number, department, phone, pass_valid_from, pass_valid_to],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Bus pass added", id: result.insertId });
    }
  );
});

router.delete("/bus-points/:id", (req, res) => {
  db.query("DELETE FROM bus_points WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Bus pass removed" });
  });
});


/* ========================================================
   MAINTENANCE
======================================================== */

router.get("/maintenance", (req, res) => {
  const sql = `
    SELECT m.*, b.bus_number FROM bus_maintenance m
    JOIN buses b ON m.bus_id = b.id
    ORDER BY m.maintenance_date DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post("/maintenance", (req, res) => {
  const {
    bus_id, maintenance_type, description, cost, vendor_name,
    maintenance_date, next_due_date, odometer_reading, status
  } = req.body;

  const sql = `
    INSERT INTO bus_maintenance
      (bus_id, maintenance_type, description, cost, vendor_name,
       maintenance_date, next_due_date, odometer_reading, status)
    VALUES (?,?,?,?,?,?,?,?,?)
  `;
  db.query(sql, [bus_id, maintenance_type, description, cost, vendor_name,
    maintenance_date, next_due_date, odometer_reading, status || "completed"],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Maintenance record added", id: result.insertId });
    }
  );
});


/* ========================================================
   FUEL LOG
======================================================== */

router.get("/fuel", (req, res) => {
  const sql = `
    SELECT f.*, b.bus_number FROM bus_fuel_log f
    JOIN buses b ON f.bus_id = b.id
    ORDER BY f.fuel_date DESC LIMIT 100
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

router.post("/fuel", (req, res) => {
  const { bus_id, fuel_date, liters_filled, cost_per_liter, total_cost, odometer_reading, fuel_station, filled_by } = req.body;
  const sql = `
    INSERT INTO bus_fuel_log
      (bus_id, fuel_date, liters_filled, cost_per_liter, total_cost, odometer_reading, fuel_station, filled_by)
    VALUES (?,?,?,?,?,?,?,?)
  `;
  db.query(sql, [bus_id, fuel_date, liters_filled, cost_per_liter, total_cost, odometer_reading, fuel_station, filled_by],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Fuel log added", id: result.insertId });
    }
  );
});


/* ========================================================
   BUS - ROUTE ASSIGNMENT
======================================================== */

router.post("/assign-route", (req, res) => {
  const { bus_id, route_id, shift } = req.body;
  const sql = "INSERT INTO bus_route_assignments (bus_id, route_id, shift) VALUES (?,?,?)";
  db.query(sql, [bus_id, route_id, shift || "both"], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Bus assigned to route", id: result.insertId });
  });
});

router.delete("/assign-route/:id", (req, res) => {
  db.query("DELETE FROM bus_route_assignments WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Assignment removed" });
  });
});


/* ========================================================
   DASHBOARD SUMMARY
======================================================== */

router.get("/dashboard", (req, res) => {
  const queries = {
    total_buses:       "SELECT COUNT(*) AS count FROM buses",
    active_buses:      "SELECT COUNT(*) AS count FROM buses WHERE status='active'",
    under_maintenance: "SELECT COUNT(*) AS count FROM buses WHERE status='under_maintenance'",
    total_routes:      "SELECT COUNT(*) AS count FROM bus_routes WHERE status='active'",
    total_drivers:     "SELECT COUNT(*) AS count FROM transport_drivers WHERE status='active'",
    expiring_insurance:`SELECT COUNT(*) AS count FROM bus_insurance
      WHERE status='active' AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)`,
  };

  const results = {};
  let completed = 0;
  const keys = Object.keys(queries);

  keys.forEach((key) => {
    db.query(queries[key], (err, result) => {
      if (err) { results[key] = 0; }
      else { results[key] = result[0].count; }
      completed++;
      if (completed === keys.length) res.json(results);
    });
  });
});

module.exports = router;
