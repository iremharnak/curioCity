#!/usr/bin/env node

/**
 * Airtable Verification Script
 * Tests your Airtable PAT and Base ID to ensure proper access
 * 
 * Usage: node scripts/verify-airtable.js
 */

const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = "Table: Global Curiosities"; // Note: Actual table name from Airtable
const VIEW_NAME = "Published_Curiosities";

if (!PAT || !BASE_ID) {
  console.error('❌ Missing AIRTABLE_PAT or AIRTABLE_BASE_ID in .env.local');
  console.error('   Make sure .env.local exists in the project root.');
  process.exit(1);
}

async function verifyAirtable() {
  console.log('\n🔍 Verifying Airtable Configuration...\n');
  console.log(`Base ID: ${BASE_ID}`);
  console.log(`PAT: ${PAT.substring(0, 10)}...${PAT.substring(PAT.length - 4)}`);
  console.log();

  // Step 1: List bases (requires schema.bases:read scope)
  console.log('1️⃣  Testing schema.bases:read scope...');
  try {
    const basesRes = await fetch('https://api.airtable.com/v0/meta/bases', {
      headers: { Authorization: `Bearer ${PAT}` }
    });
    
    if (!basesRes.ok) {
      const error = await basesRes.text();
      console.error(`   ❌ Failed to list bases (${basesRes.status}):`, error);
      console.error('   → Your PAT may not have schema.bases:read scope');
    } else {
      const basesData = await basesRes.json();
      console.log(`   ✅ Successfully listed ${basesData.bases?.length || 0} bases`);
      
      const targetBase = basesData.bases?.find(b => b.id === BASE_ID);
      if (targetBase) {
        console.log(`   ✅ Found base: "${targetBase.name}"`);
      } else {
        console.log(`   ⚠️  Warning: Base ${BASE_ID} not found in your accessible bases`);
      }
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }

  console.log();

  // Step 2: Get base schema (requires schema.bases:read scope)
  console.log('2️⃣  Testing base schema access...');
  try {
    const schemaRes = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, {
      headers: { Authorization: `Bearer ${PAT}` }
    });
    
    if (!schemaRes.ok) {
      const error = await schemaRes.text();
      console.error(`   ❌ Failed to get base schema (${schemaRes.status}):`, error);
    } else {
      const schemaData = await schemaRes.json();
      console.log(`   ✅ Successfully retrieved base schema`);
      console.log(`   Tables found: ${schemaData.tables?.length || 0}`);
      
      const targetTable = schemaData.tables?.find(t => t.name === TABLE_NAME);
      if (targetTable) {
        console.log(`   ✅ Found table: "${TABLE_NAME}" (ID: ${targetTable.id})`);
        
        // Check for views
        const targetView = targetTable.views?.find(v => v.name === VIEW_NAME);
        if (targetView) {
          console.log(`   ✅ Found view: "${VIEW_NAME}" (ID: ${targetView.id})`);
        } else {
          console.log(`   ⚠️  Warning: View "${VIEW_NAME}" not found`);
          console.log(`   Available views:`, targetTable.views?.map(v => v.name).join(', '));
        }
      } else {
        console.log(`   ❌ Table "${TABLE_NAME}" not found`);
        console.log(`   Available tables:`, schemaData.tables?.map(t => t.name).join(', '));
      }
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }

  console.log();

  // Step 3: Fetch records from the table (requires data.records:read scope)
  console.log('3️⃣  Testing data.records:read scope...');
  const encodedTable = encodeURIComponent(TABLE_NAME);
  const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodedTable}`);
  url.searchParams.set('view', VIEW_NAME);
  url.searchParams.set('maxRecords', '3');
  
  console.log(`   Request URL: ${url.toString()}`);
  
  try {
    const recordsRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${PAT}` }
    });
    
    if (!recordsRes.ok) {
      const error = await recordsRes.text();
      console.error(`   ❌ Failed to fetch records (${recordsRes.status}):`, error);
      console.error('   → Your PAT may not have data.records:read scope');
    } else {
      const recordsData = await recordsRes.json();
      console.log(`   ✅ Successfully fetched ${recordsData.records?.length || 0} records`);
      
      if (recordsData.records && recordsData.records.length > 0) {
        const firstRecord = recordsData.records[0];
        console.log(`   First record ID: ${firstRecord.id}`);
        console.log(`   Fields:`, Object.keys(firstRecord.fields).join(', '));
      }
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }

  console.log('\n✨ Verification complete!\n');
}

verifyAirtable().catch(console.error);
