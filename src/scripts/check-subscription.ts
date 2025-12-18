
import * as admin from 'firebase-admin';
import { getApps, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
    try {
        const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (serviceAccountEnv) {
             const serviceAccount = JSON.parse(serviceAccountEnv);
             admin.initializeApp({
                credential: cert(serviceAccount)
              });
              console.log('Initialized with FIREBASE_SERVICE_ACCOUNT env var');
        } else {
             admin.initializeApp({
                credential: applicationDefault()
              });
              console.log('Initialized with applicationDefault()');
        }
    } catch (e) {
        console.error('Failed to initialize admin:', e);
        process.exit(1);
    }
}

const db = getFirestore();

async function checkSubscription(email: string) {
  console.log(`Checking subscription for email: ${email}`);

  try {
    // 1. Find User by Email
    console.log('Querying users collection...');
    const usersSnapshot = await db.collection('users').where('email', '==', email).get();

    if (usersSnapshot.empty) {
        // Try 'emailAddress' field just in case
        const usersSnapshot2 = await db.collection('users').where('emailAddress', '==', email).get();
        if (usersSnapshot2.empty) {
             console.log('No user found with this email.');
             return;
        }
         console.log(`Found user with emailAddress: ${email}`);
         usersSnapshot2.forEach(doc => processUser(doc));
         return;
    }

    usersSnapshot.forEach(doc => processUser(doc));

  } catch (error) {
    console.error('Error checking subscription:', error);
  }
}

async function processUser(userDoc: admin.firestore.QueryDocumentSnapshot) {
    const userData = userDoc.data();
    console.log('--------------------------------------------------');
    console.log('User Found ID:', userDoc.id);
    console.log('User Data:', JSON.stringify(userData, null, 2));

    const companyId = userData.companyId || (userData.companyData ? userData.companyData.companyId : null);

    if (companyId) {
        console.log(`\nChecking Company ID: ${companyId}`);
        const companyDoc = await db.collection('companies').doc(companyId).get();

        if (companyDoc.exists) {
            console.log('Company Data:', JSON.stringify(companyDoc.data(), null, 2));
        } else {
            console.log('Company document does NOT exist.');
             // Check if there is a company doc with the user's UID (the new repair logic)
             if (companyId !== userDoc.id) {
                 const companyDocByUserId = await db.collection('companies').doc(userDoc.id).get();
                 if (companyDocByUserId.exists) {
                     console.log(`\nFound Company document using User ID (${userDoc.id}) instead:`);
                      console.log(JSON.stringify(companyDocByUserId.data(), null, 2));
                 }
             }
        }
    } else {
        console.log('No companyId found on user document.');
        // Check if there is a company doc with the user's UID anyway
        const companyDocByUserId = await db.collection('companies').doc(userDoc.id).get();
        if (companyDocByUserId.exists) {
            console.log(`\nFound Company document using User ID (${userDoc.id}):`);
             console.log(JSON.stringify(companyDocByUserId.data(), null, 2));
        } else {
            console.log(`No company document found for User ID (${userDoc.id}) either.`);
        }
    }
    console.log('--------------------------------------------------');
}

// Run
checkSubscription('emmanuel.gama.ibarra@gmail.com');
