const express = require('express');
const Section = require('../models/Section');
const Table = require('../models/Table');
const router = express.Router();


// Create tables API according to sections
router.post('/:sectionId/tables', async (req, res) => {
    const { sectionId } = req.params;
    const { numberOfTables } = req.body; // Assuming numberOfTables is a number

    try {
        const section = await Section.findById(sectionId);

        if (!section) {
            return res.status(404).json({ message: 'Section not found' });
        }

        // Check if the provided number of tables is valid
        if (!Number.isInteger(numberOfTables) || numberOfTables <= 0) {
            return res.status(400).json({ message: 'Invalid number of tables provided' });
        }

        const existingTableNames = new Set(section.tableNames.map(table => table.tableName)); // Using Set for efficient lookup

        // Determine the highest numbered table already present
        let highestTableNumber = 0;
        existingTableNames.forEach(tableName => {
            const match = tableName.match(/\d+/);
            if (match) {
                const tableNumber = parseInt(match[0], 10);
                if (!isNaN(tableNumber) && tableNumber > highestTableNumber) {
                    highestTableNumber = tableNumber;
                }
            }
        });

        const savedTables = [];
        for (let i = 0; i < numberOfTables; i++) {
            let tableNumber = highestTableNumber + i + 1;
            let tableName = '';

            // Check if the section name is "room section" to prefix table names with "R"
            if (section.name.toLowerCase() === 'room section') {
                tableName = `ROOM${tableNumber}`;
            } else {
                tableName = `${tableNumber}`;
            }

            // Check if the generated table name already exists in the section
            while (existingTableNames.has(tableName)) {
                tableNumber++;
                tableName = `${tableNumber}`;
            }

            // Create and save the new table
            const newTable = new Table({
                tableName,
                section: { name: section.name, _id: sectionId }
            });
            const savedTable = await newTable.save();
            savedTables.push(savedTable);

            // Update the Set of existing table names
            existingTableNames.add(tableName);

            // Update the Section document with the new table name and table ID
            section.tableNames.push({ tableName: savedTable.tableName, tableId: savedTable._id });
        }

        // Save the updated section with new table names and table IDs
        await section.save();

        res.status(201).json(savedTables);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// router.post('/:sectionId/tables', async (req, res) => {
//     const { sectionId } = req.params;
//     const { numberOfTables } = req.body; // Assuming numberOfTables is a number

//     try {
//         const section = await Section.findById(sectionId);

//         if (!section) {
//             return res.status(404).json({ message: 'Section not found' });
//         }

//         // Check if the provided number of tables is valid
//         if (!Number.isInteger(numberOfTables) || numberOfTables <= 0) {
//             return res.status(400).json({ message: 'Invalid number of tables provided' });
//         }

//         const existingTableNames = new Set(section.tableNames.map(table => table.tableName)); // Using Set for efficient lookup

//         // Determine the highest numbered table already present
//         let highestTableNumber = 0;
//         existingTableNames.forEach(tableName => {
//             const match = tableName.match(/\d+/);
//             if (match) {
//                 const tableNumber = parseInt(match[0], 10);
//                 if (!isNaN(tableNumber) && tableNumber > highestTableNumber) {
//                     highestTableNumber = tableNumber;
//                 }
//             }
//         });

//         const savedTables = [];
//         for (let i = 0; i < numberOfTables; i++) {
//             let tableNumber = highestTableNumber + i + 1;
//             let tableName = `${tableNumber}`;

//             // Check if the generated table name already exists in the section
//             while (existingTableNames.has(tableName)) {
//                 tableNumber++;
//                 tableName = `${tableNumber}`;
//             }

//             // Create and save the new table
//             const newTable = new Table({
//                 tableName,
//                 section: { name: section.name, _id: sectionId }
//             });
//             const savedTable = await newTable.save();
//             savedTables.push(savedTable);

//             // Update the Set of existing table names
//             existingTableNames.add(tableName);

//             // Update the Section document with the new table name and table ID
//             section.tableNames.push({ tableName: savedTable.tableName, tableId: savedTable._id });
//         }

//         // Save the updated section with new table names and table IDs
//         await section.save();

//         res.status(201).json(savedTables);
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// });

// Create tables API according to sections
// router.post('/:sectionId/tables', async (req, res) => {
//     const { sectionId } = req.params;
//     const { tableName } = req.body;

//     try {
//         const section = await Section.findById(sectionId);

//         if (!section) {
//             return res.status(404).json({ message: 'Section not found' });
//         }

//         const newTable = new Table
//             ({
//                 tableName,
//                 section: { name: section.name, _id: sectionId }
//             });
//         const savedTable = await newTable.save();

//         console.log(savedTable._id)
//         // Update the Section document with the new table name and table ID
//         section.tableNames.push({ tableName: savedTable.tableName, tableId: savedTable._id });
//         await section.save();

//         res.status(201).json(savedTable);
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// });




// Edit table API
// router.patch('/tables/:id', async (req, res) => {
//     const { id } = req.params;
//     const { tableName } = req.body;

//     try {
//         const tableToUpdate = await Table.findById(id);

//         if (!tableToUpdate) {
//             return res.status(404).json({ message: 'Table not found' });
//         }

//         // Update the table name
//         tableToUpdate.tableName = tableName !== undefined ? tableName : tableToUpdate.tableName;

//         const updatedTable = await tableToUpdate.save();

//         // If the table is associated with a section, update the section's table name
//         if (tableToUpdate.section && tableToUpdate.section._id) {
//             const section = await Section.findById(tableToUpdate.section._id);

//             if (section) {
//                 const tableIndex = section.tableNames.findIndex(
//                     (table) => table.tableId.toString() === updatedTable._id.toString()
//                 );

//                 if (tableIndex !== -1) {
//                     section.tableNames[tableIndex].tableName = updatedTable.tableName;
//                     await section.save();
//                 }
//             }
//         }

//         res.json(updatedTable);
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// });

router.patch('/tables/:id', async (req, res) => {
    const { id } = req.params;
    const { tableName, sectionId } = req.body;

    try {
        const tableToUpdate = await Table.findById(id);

        if (!tableToUpdate) {
            return res.status(404).json({ message: 'Table not found' });
        }

        // Update the table name
        tableToUpdate.tableName = tableName !== undefined ? tableName : tableToUpdate.tableName;

        // If the table is associated with a section, update the association
        if (sectionId && sectionId !== tableToUpdate.section?._id.toString()) {
            const newSection = await Section.findById(sectionId);

            if (!newSection) {
                return res.status(404).json({ message: 'Section not found' });
            }

            // Update the section reference in the table
            tableToUpdate.section = { name: newSection.name, _id: newSection._id };
        }

        const updatedTable = await tableToUpdate.save();

        // If the table is associated with a section, update the section's table name
        if (tableToUpdate.section && tableToUpdate.section._id) {
            const section = await Section.findById(tableToUpdate.section._id);

            if (section) {
                const tableIndex = section.tableNames.findIndex(
                    (table) => table.tableId.toString() === updatedTable._id.toString()
                );

                if (tableIndex !== -1) {
                    section.tableNames[tableIndex].tableName = updatedTable.tableName;
                    await section.save();
                }
            }
        }

        res.json(updatedTable);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});



// Delete table API
router.delete('/tables/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const tableToDelete = await Table.findByIdAndDelete(id);

        if (!tableToDelete) {
            return res.status(404).json({ message: 'Table not found' });
        }

        const sectionId = tableToDelete.section ? tableToDelete.section._id : null;

        // If the table was associated with a section, remove table reference from the section
        if (sectionId) {
            const section = await Section.findById(sectionId);

            if (section) {
                section.tableNames = section.tableNames.filter(
                    (table) => table.tableId.toString() !== id.toString()
                );
                await section.save();
            }
        }

        res.json({ message: 'Table deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});



// Get all tables List API
router.get('/tables', async (req, res) => {
    try {
        const tables = await Table.find();
        res.json(tables);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// Get Single Table API
router.get('/tables/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const table = await Table.findById(id);

        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }

        res.json(table);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



module.exports = router;
