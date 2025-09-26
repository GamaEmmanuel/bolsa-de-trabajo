// Script to update existing job postings from 'pending_approval' to 'published'
// Run this script to fix any existing jobs that were created with the wrong status

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, doc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBjG3M5sb9y6xk1bu_-lp-aSBIn8ng2UZ8",
  authDomain: "jobportal-4b561.firebaseapp.com",
  projectId: "jobportal-4b561",
  storageBucket: "jobportal-4b561.firebasestorage.app",
  messagingSenderId: "679742411599",
  appId: "1:679742411599:web:3cf2873537296aacdbeb3a",
  measurementId: "G-PX2T3R6M1T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateJobStatuses() {
  try {
    console.log('🔍 Searching for jobs with pending_approval status...');

    // Query for jobs with pending_approval status
    const q = query(
      collection(db, 'jobPostings'),
      where('status', '==', 'pending_approval')
    );

    const querySnapshot = await getDocs(q);
    console.log(`📊 Found ${querySnapshot.size} jobs with pending_approval status`);

    if (querySnapshot.size === 0) {
      console.log('✅ No jobs need updating. All jobs are already published or have other statuses.');
      return;
    }

    // Update each job to published status
    const updatePromises = [];
    querySnapshot.forEach((docSnapshot) => {
      const jobRef = doc(db, 'jobPostings', docSnapshot.id);
      const updatePromise = updateDoc(jobRef, {
        status: 'published',
        updatedAt: new Date().toISOString()
      });
      updatePromises.push(updatePromise);
      console.log(`📝 Updating job: ${docSnapshot.data().jobTitle} (ID: ${docSnapshot.id})`);
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    console.log(`✅ Successfully updated ${querySnapshot.size} jobs to published status!`);
    console.log('🎉 All jobs should now be visible to candidates.');

  } catch (error) {
    console.error('❌ Error updating job statuses:', error);
  }
}

// Run the update
updateJobStatuses().then(() => {
  console.log('🏁 Update process completed.');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
