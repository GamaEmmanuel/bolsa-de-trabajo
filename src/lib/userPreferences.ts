import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

export type AccountType = 'personal' | 'enterprise'

export interface UserPreferences {
	accountType: AccountType
	role: 'candidate' | 'recruiter'
	companySetupCompleted?: boolean
}

/**
 * Get user preferences from Firestore
 * @param userId - The user's UID
 * @returns Promise<UserPreferences | null> - User preferences or null if not found
 */
export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
	try {
		const userRef = doc(db, 'users', userId)
		const userDoc = await getDoc(userRef)

		if (userDoc.exists()) {
			const userData = userDoc.data()
			if (userData.accountType && userData.role) {
				return {
					accountType: userData.accountType,
					role: userData.role
				}
			}
		}
		return null
	} catch (error) {
		console.error('Error fetching user preferences:', error)
		return null
	}
}

/**
 * Get the appropriate redirect path based on user preferences
 * @param preferences - User preferences
 * @returns string - The redirect path
 */
export const getRedirectPath = (preferences: UserPreferences): string => {
	if (preferences.accountType === 'personal') {
		return '/candidate/dashboard'
	} else {
		// For enterprise accounts, check if setup is completed
		return preferences.companySetupCompleted ? '/company/dashboard' : '/company/setup'
	}
}
