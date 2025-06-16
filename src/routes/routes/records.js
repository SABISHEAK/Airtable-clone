// record routes - handles creating, reading, updating, deleting records
const express = require('express');
const Table = require('../models/Table');
const Record = require('../models/Record');
const { checkFieldData } = require('../utils/validators');

const router = express.Router();

// get all records for a specific table
router.get('/tables/:tableId/records', checkAuth, async (req, res) => {
  try {
    // find all records for this table that belong to this user
    const records = await Record.find({ 
      tableId: req.params.tableId, 
      userId: req.user.userId 
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create a new record
router.post('/tables/:tableId/records', checkAuth, async (req, res) => {
  try {
    const { data } = req.body;
    
    // first, get the table to check what fields it has
    const table = await Table.findOne({ 
      _id: req.params.tableId, 
      userId: req.user.userId 
    });
    
    if (!table) {
      return res.status(404).json({ error: 'Table not found or you dont have access to it' });
    }

    // validate the data against each field in the table
    const validationErrors = [];
    for (const field of table.fields) {
      const error = checkFieldData(field, data[field.name]);
      if (error) {
        validationErrors.push(error);
      }
    }

    // if there are validation errors, send them back
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // create new record
    const newRecord = new Record({
      tableId: req.params.tableId,
      userId: req.user.userId,
      data
    });
    
    await newRecord.save();
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update an existing record
router.put('/tables/:tableId/records/:recordId', checkAuth, async (req, res) => {
  try {
    const { data } = req.body;
    
    // get the table to validate against
    const table = await Table.findOne({ 
      _id: req.params.tableId, 
      userId: req.user.userId 
    });
    
    if (!table) {
      return res.status(404).json({ error: 'Table not found or you dont have access to it' });
    }

    // validate the new data
    const validationErrors = [];
    for (const field of table.fields) {
      const error = checkFieldData(field, data[field.name]);
      if (error) {
        validationErrors.push(error);
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // update the record
    const updatedRecord = await Record.findOneAndUpdate(
      { 
        _id: req.params.recordId, 
        tableId: req.params.tableId, 
        userId: req.user.userId 
      },
      { 
        data, 
        updatedAt: new Date() 
      },
      { new: true } // return the updated record
    );
    
    if (!updatedRecord) {
      return res.status(404).json({ error: 'Record not found or you dont have permission to update it' });
    }
    
    res.json(updatedRecord);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete a record
router.delete('/tables/:tableId/records/:recordId', checkAuth, async (req, res) => {
  try {
    // find and delete the record
    const deletedRecord = await Record.findOneAndDelete({ 
      _id: req.params.recordId, 
      tableId: req.params.tableId, 
      userId: req.user.userId 
    });
    
    if (!deletedRecord) {
      return res.status(404).json({ error: 'Record not found or you dont have permission to delete it' });
    }
    
    res.json({ message: 'Record deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;