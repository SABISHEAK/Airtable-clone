// table routes - handles creating, reading, updating, deleting tables
const express = require('express');
const Table = require('../models/Table');
const Record = require('../models/Record');

const router = express.Router();

// get all tables for the logged in user
router.get('/tables', checkAuth, async (req, res) => {
  try {
    // find all tables that belong to this user
    const userTables = await Table.find({ userId: req.user.userId });
    res.json(userTables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create a new table
router.post('/tables', checkAuth, async (req, res) => {
  try {
    const { name, fields } = req.body;
    
    // check if all field types are valid
    const validFieldTypes = [
      'text', 'number', 'email', 'url', 'phone', 'date', 
      'datetime', 'checkbox', 'dropdown', 'multiselect', 'textarea', 'currency'
    ];
    
    for (const field of fields) {
      if (!validFieldTypes.includes(field.type)) {
        return res.status(400).json({ 
          error: `"${field.type}" is not a valid field type` 
        });
      }
    }

    // create new table
    const newTable = new Table({
      name,
      fields,
      userId: req.user.userId
    });
    
    await newTable.save();
    res.status(201).json(newTable);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get a specific table
router.get('/tables/:id', checkAuth, async (req, res) => {
  try {
    // find table that belongs to this user
    const table = await Table.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });
    
    if (!table) {
      return res.status(404).json({ error: 'Table not found or you dont have access to it' });
    }
    
    res.json(table);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete a table
router.delete('/tables/:id', checkAuth, async (req, res) => {
  try {
    // find and delete table
    const deletedTable = await Table.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });
    
    if (!deletedTable) {
      return res.status(404).json({ error: 'Table not found or you dont have permission to delete it' });
    }
    
    // also delete all records in this table
    await Record.deleteMany({ 
      tableId: req.params.id, 
      userId: req.user.userId 
    });
    
    res.json({ message: 'Table and all its records deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;