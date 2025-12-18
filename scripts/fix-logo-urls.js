/**
 * Migration Script: Fix Logo URLs
 *
 * Problem: Logos were being saved to users/{userId}/companyData.logoUrl
 * but fetched from companies/{companyId}/logoUrl
 *
 * This script:
 * 1. Finds all companies with logos in Storage but not in Firestore
 * 2. Updates the companies collection with the correct logoUrl
 */

const admin = require('firebase-admin');
const serviceAccount = require('../jobportal-4b561-firebase-adminsdk-fbsvc-3052bc11c1.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'jobportal-4b561.firebasestorage.app'
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function getStorageLogoUrl(companyId) {
  try {
    const [files] = await bucket.getFiles({
      prefix: `company-logos/${companyId}/`
    });

    if (files.length === 0) {
      return null;
    }

    // Get the most recently uploaded file
    files.sort((a, b) => {
      return new Date(b.metadata.updated) - new Date(a.metadata.updated);
    });

    const latestFile = files[0];
    const [metadata] = await latestFile.getMetadata();

    // Generate the download URL
    const encodedName = encodeURIComponent(latestFile.name);
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${metadata.bucket}/o/${encodedName}?alt=media`;

    return {
      url: downloadUrl,
      fileName: latestFile.name,
      updated: metadata.updated,
      size: Math.round(metadata.size / 1024)
    };
  } catch (error) {
    console.error(`Error getting storage logo for ${companyId}:`, error.message);
    return null;
  }
}

async function fixCompanyLogo(companyId, dryRun = true) {
  console.log(`\n--- Checking company: ${companyId} ---`);

  // Check companies collection
  const companyDoc = await db.collection('companies').doc(companyId).get();

  if (!companyDoc.exists) {
    console.log('❌ Company document not found in Firestore');
    return;
  }

  const companyData = companyDoc.data();
  const hasLogoInDb = !!companyData.logoUrl;

  console.log(`Database logoUrl: ${hasLogoInDb ? '✅ EXISTS' : '❌ MISSING'}`);

  // Check storage
  const storageInfo = await getStorageLogoUrl(companyId);

  if (!storageInfo) {
    console.log('Storage logoUrl: ❌ No files in storage');
    return;
  }

  console.log(`Storage logoUrl: ✅ EXISTS`);
  console.log(`  File: ${storageInfo.fileName}`);
  console.log(`  Size: ${storageInfo.size} KB`);
  console.log(`  Updated: ${storageInfo.updated}`);
  console.log(`  URL: ${storageInfo.url.substring(0, 80)}...`);

  // If database has no logo but storage does, fix it
  if (!hasLogoInDb && storageInfo) {
    console.log('\n🔧 FIX NEEDED: Storage has logo but database does not');

    if (dryRun) {
      console.log('🔍 DRY RUN: Would update companies/' + companyId + ' with logoUrl');
    } else {
      try {
        await db.collection('companies').doc(companyId).update({
          logoUrl: storageInfo.url,
          lastUpdated: new Date().toISOString()
        });
        console.log('✅ FIXED: Updated companies/' + companyId + ' with logoUrl');
      } catch (error) {
        console.error('❌ ERROR updating database:', error.message);
      }
    }
  } else if (hasLogoInDb) {
    console.log('✅ No fix needed - database already has logoUrl');
  }
}

async function fixAllCompanies(dryRun = true) {
  console.log('\n========================================');
  console.log('Logo URL Migration Script');
  console.log('========================================');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN' : '⚠️ LIVE UPDATE'}\n`);

  // Get all companies
  const companiesSnapshot = await db.collection('companies').get();
  console.log(`Found ${companiesSnapshot.size} companies in database\n`);

  let fixedCount = 0;
  let needsFixCount = 0;

  for (const doc of companiesSnapshot.docs) {
    const companyId = doc.id;
    const companyData = doc.data();

    const hasLogoInDb = !!companyData.logoUrl;
    const storageInfo = await getStorageLogoUrl(companyId);

    if (!hasLogoInDb && storageInfo) {
      needsFixCount++;
      await fixCompanyLogo(companyId, dryRun);
      if (!dryRun) fixedCount++;
    }
  }

  console.log('\n========================================');
  console.log('Summary:');
  console.log('========================================');
  console.log(`Total companies: ${companiesSnapshot.size}`);
  console.log(`Companies needing fix: ${needsFixCount}`);
  if (!dryRun) {
    console.log(`Companies fixed: ${fixedCount}`);
  }
  console.log('\n');
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const dryRun = !args.includes('--live');

if (command === 'fix-all') {
  fixAllCompanies(dryRun)
    .then(() => {
      console.log('✅ Migration complete');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
} else if (command === 'fix-one') {
  const companyId = args[1] || 'uKM7Todh43gIECc7z7slAS63NKU2';
  fixCompanyLogo(companyId, dryRun)
    .then(() => {
      console.log('\n✅ Check complete');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Check failed:', err);
      process.exit(1);
    });
} else {
  console.log(`
Logo URL Migration Script

Usage:
  node fix-logo-urls.js fix-one [companyId] [--live]
    Fix a single company (default: uKM7Todh43gIECc7z7slAS63NKU2)
    Add --live to actually update the database

  node fix-logo-urls.js fix-all [--live]
    Check all companies and fix those with mismatched logos
    Add --live to actually update the database

Examples:
  node fix-logo-urls.js fix-one                    # Dry run for default company
  node fix-logo-urls.js fix-one --live             # Actually fix default company
  node fix-logo-urls.js fix-one ABC123 --live      # Fix specific company
  node fix-logo-urls.js fix-all                    # Dry run for all companies
  node fix-logo-urls.js fix-all --live             # Fix all companies

By default, runs in DRY RUN mode (no changes made).
  `);
  process.exit(0);
}

