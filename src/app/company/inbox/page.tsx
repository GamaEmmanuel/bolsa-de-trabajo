'use client'

import React, { useState, useEffect, useRef } from 'react'
import { db, auth, storage } from '../../../lib/firebase'
import {
	collection,
	query,
	onSnapshot,
	addDoc,
	updateDoc,
	doc,
	getDoc,
	orderBy,
	where,
	serverTimestamp,
	writeBatch
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { onAuthStateChanged } from 'firebase/auth'
import { useSearchParams } from 'next/navigation'
import { Conversation, Message, MessageAttachment, JobPosting, Application } from '../../../types'

const CompanyInboxPage = () => {
	console.log('🚀🚀🚀 COMPANY INBOX PAGE LOADED 🚀🚀🚀')

	const [user, setUser] = useState(auth.currentUser)
	const [companyName, setCompanyName] = useState<string>('Company')
	const [companyLogoUrl, setCompanyLogoUrl] = useState<string>('')
	const [conversations, setConversations] = useState<Conversation[]>([])
	const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
	const [messages, setMessages] = useState<Message[]>([])
	const [newMessage, setNewMessage] = useState('')
	const [loading, setLoading] = useState(true)
	const [uploadingFile, setUploadingFile] = useState(false)
	const [showArchived, setShowArchived] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
	const [editingContent, setEditingContent] = useState('')
	const [activeMessageId, setActiveMessageId] = useState<string | null>(null)

	// Position filtering state
	const [activeJobs, setActiveJobs] = useState<JobPosting[]>([])
	const [applications, setApplications] = useState<Application[]>([])
	const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all')

	const messagesEndRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const searchParams = useSearchParams()

	console.log('📊 Component state:', {
		hasUser: !!user,
		companyName,
		companyLogoUrl,
		conversationsCount: conversations.length,
		hasSelectedConv: !!selectedConversation,
		messagesCount: messages.length,
		loading
	})

	// Auto-scroll to bottom when new messages arrive
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	// Fetch company name and logo
	useEffect(() => {
		const fetchCompanyData = async () => {
			if (!auth.currentUser) {
				console.log('📛 No authenticated user, skipping company data fetch')
				return
			}

			console.log('🏢 Fetching company data for user:', auth.currentUser.uid)

			try {
				// Get company info from users collection
				const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
				console.log('📄 User document exists:', userDoc.exists())

				if (userDoc.exists()) {
					const userData = userDoc.data()
					console.log('👤 User data:', userData)

					// First try to get company data directly from user document (most up to date)
					if (userData.companyData && userData.companyData.companyName) {
						console.log('✅ Company name from user companyData:', userData.companyData.companyName)
						setCompanyName(userData.companyData.companyName)

						if (userData.companyData.logoUrl) {
							console.log('✅ Company logo from user companyData:', userData.companyData.logoUrl)
							setCompanyLogoUrl(userData.companyData.logoUrl)
						}
						return // We found the data, no need to check companies collection
					}

					// Fallback: Try to get company ID and fetch from companies collection
					const companyId = userData.companyId || userData.companyData?.companyId
					console.log('🔍 Company ID from user data:', companyId)

					if (companyId) {
						// Fetch company document
						console.log('📡 Fetching company document:', companyId)
						const companyDoc = await getDoc(doc(db, 'companies', companyId))
						console.log('🏭 Company document exists:', companyDoc.exists())

						if (companyDoc.exists()) {
							const companyData = companyDoc.data()
							console.log('🏢 Company data:', companyData)

							// Set company name from company document
							if (companyData.companyName) {
								console.log('✅ Company name from company doc:', companyData.companyName)
								setCompanyName(companyData.companyName)
							}

							if (companyData.logoUrl) {
								console.log('✅ Company logo found:', companyData.logoUrl)
								setCompanyLogoUrl(companyData.logoUrl)
							}
						} else {
							console.log('⚠️ No company document found for ID:', companyId)
						}
					} else {
						console.log('⚠️ No company ID found in user data')
					}
				}
			} catch (error) {
				console.error('❌ Error fetching company data:', error)
			}
		}

		const unsubscribe = onAuthStateChanged(auth, (user) => {
			console.log('🔐 Auth state changed, user:', user?.uid || 'No user')
			if (user) {
				fetchCompanyData()
			}
		})

		return () => unsubscribe()
	}, [])

	// Fetch active jobs for filter dropdown
	useEffect(() => {
		console.log('🔄 Setting up jobs listener for filtering')

		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			if (!currentUser) {
				console.log('❌ No authenticated user for jobs')
				return
			}

			console.log('✅ User authenticated, fetching active jobs for:', currentUser.uid)

			// Query active/published jobs for this company
			const jobsQuery = query(
				collection(db, 'jobPostings'),
				where('companyId', '==', currentUser.uid),
				where('status', '==', 'published')
			)

			const unsubscribe = onSnapshot(jobsQuery,
				(querySnapshot) => {
					console.log('💼 Jobs snapshot received, count:', querySnapshot.size)

					const jobsData: JobPosting[] = []
					querySnapshot.forEach(doc => {
						jobsData.push({
							jobId: doc.id,
							...doc.data()
						} as JobPosting)
					})

					setActiveJobs(jobsData)
					console.log('✅ Active jobs loaded:', jobsData.length)
				},
				(error) => {
					if (error.code === 'permission-denied') {
						console.log('🔒 Jobs listener: User signed out, ignoring permission error')
						return
					}
					console.error('❌ ERROR fetching jobs:', error)
				}
			)

			return () => {
				console.log('🛑 Unsubscribing from jobs listener')
				unsubscribe()
			}
		})

		return () => unsubscribeAuth()
	}, [])

	// Fetch all applications for this company
	useEffect(() => {
		console.log('🔄 Setting up applications listener')

		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			if (!currentUser) {
				console.log('❌ No authenticated user for applications')
				return
			}

			console.log('✅ User authenticated, fetching applications for:', currentUser.uid)

			// Query all applications for this company
			const applicationsQuery = query(
				collection(db, 'applications'),
				where('companyId', '==', currentUser.uid)
			)

			const unsubscribe = onSnapshot(applicationsQuery,
				(querySnapshot) => {
					console.log('📋 Applications snapshot received, count:', querySnapshot.size)

					const applicationsData: Application[] = []
					querySnapshot.forEach(doc => {
						applicationsData.push({
							applicationId: doc.id,
							...doc.data()
						} as Application)
					})

					setApplications(applicationsData)
					console.log('✅ Applications loaded:', applicationsData.length)
				},
				(error) => {
					if (error.code === 'permission-denied') {
						console.log('🔒 Applications listener: User signed out, ignoring permission error')
						return
					}
					console.error('❌ ERROR fetching applications:', error)
				}
			)

			return () => {
				console.log('🛑 Unsubscribing from applications listener')
				unsubscribe()
			}
		})

		return () => unsubscribeAuth()
	}, [])

	// Fetch conversations
	useEffect(() => {
		console.log('🔄 Setting up conversations listener')

		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser)

			if (!currentUser) {
				console.log('❌ No authenticated user for conversations')
				setLoading(false)
				return
			}

			console.log('✅ User authenticated, fetching conversations for:', currentUser.uid)

			// Query conversations where this company is a participant
			const conversationsQuery = query(
				collection(db, 'conversations'),
				where('participants', 'array-contains', currentUser.uid),
				orderBy('lastMessageTimestamp', 'desc')
			)

			console.log('📡 Starting conversations snapshot listener...')

			const unsubscribe = onSnapshot(conversationsQuery,
				(querySnapshot) => {
					console.log('💬 Conversations snapshot received, count:', querySnapshot.size)

					const conversationsData: Conversation[] = []
					querySnapshot.forEach(doc => {
						const data = doc.data()
						console.log('📝 Conversation:', doc.id, data)
						conversationsData.push({
							conversationId: doc.id,
							...data
						} as Conversation)
					})

					setConversations(conversationsData)
					setLoading(false)
					console.log('✅ Conversations loaded:', conversationsData.length)

					// Auto-select conversation if candidateId is in URL params
					const candidateId = searchParams.get('candidateId')
					const candidateName = searchParams.get('candidateName')

					if (candidateId) {
						console.log('🔍 Looking for conversation with candidateId:', candidateId)

						if (conversationsData.length > 0) {
							const existingConv = conversationsData.find(c => c.candidateId === candidateId)
							if (existingConv) {
								console.log('✅ Found existing conversation:', existingConv.conversationId)
								setSelectedConversation(existingConv)
							} else {
								console.log('⚠️ No existing conversation found, will need to create')
							}
						}
					}
				},
				(error) => {
					// Ignore permission errors when user signs out
					if (error.code === 'permission-denied') {
						console.log('🔒 Conversations listener: User signed out, ignoring permission error')
						setLoading(false)
						return
					}
					console.error('❌ ERROR fetching conversations:', error)
					console.error('Error code:', error.code)
					console.error('Error message:', error.message)
					setLoading(false)
				}
			)

			return () => {
				console.log('🛑 Unsubscribing from conversations listener')
				unsubscribe()
			}
		})

		return () => {
			console.log('🛑 Unsubscribing from auth listener')
			unsubscribeAuth()
		}
	}, [searchParams])

	// Fetch messages for selected conversation
	useEffect(() => {
		console.log('💬 Messages effect triggered, selectedConversation:', selectedConversation?.conversationId)

		if (!selectedConversation) {
			console.log('⚠️ No selected conversation')
			return
		}

		// Don't try to fetch messages for draft conversations
		if (selectedConversation.conversationId.startsWith('draft_')) {
			console.log('📝 Draft conversation, no messages to fetch')
			setMessages([])
			return
		}

		console.log('📡 Setting up messages listener for conversation:', selectedConversation.conversationId)

		const messagesQuery = query(
			collection(db, 'messages'),
			where('conversationId', '==', selectedConversation.conversationId),
			orderBy('timestamp', 'asc')
		)

		const unsubscribe = onSnapshot(messagesQuery,
			(querySnapshot) => {
				console.log('✉️ Messages snapshot received, count:', querySnapshot.size)

				const messagesData: Message[] = []
				querySnapshot.forEach(doc => {
					const data = doc.data()
					console.log('📨 Message:', doc.id, data)
					messagesData.push({
						messageId: doc.id,
						...data
					} as Message)
				})

				setMessages(messagesData)
				console.log('✅ Messages loaded:', messagesData.length)

				// Mark messages as read
				markMessagesAsRead()
			},
			(error) => {
				// Ignore permission errors when user signs out
				if (error.code === 'permission-denied') {
					console.log('🔒 Messages listener: User signed out, ignoring permission error')
					return
				}
				console.error('❌ ERROR fetching messages:', error)
				console.error('Error code:', error.code)
				console.error('Error message:', error.message)
			}
		)

		return () => {
			console.log('🛑 Unsubscribing from messages listener')
			unsubscribe()
		}
	}, [selectedConversation])

	// Mark messages as read
	const markMessagesAsRead = async () => {
		if (!selectedConversation || !user) return

		// Don't try to mark messages as read for draft conversations
		if (selectedConversation.conversationId.startsWith('draft_')) return

		const unreadMessages = messages.filter(m =>
			m.receiverId === user.uid && !m.read
		)

		if (unreadMessages.length === 0) return

		const batch = writeBatch(db)

		unreadMessages.forEach(message => {
			const messageRef = doc(db, 'messages', message.messageId)
			batch.update(messageRef, { read: true })
		})

		// Update conversation unread count
		const conversationRef = doc(db, 'conversations', selectedConversation.conversationId)
		batch.update(conversationRef, {
			[`unreadCount.${user.uid}`]: 0
		})

		await batch.commit()
	}

	// Create new conversation or find existing one
	const createOrFindConversation = async (candidateId: string, candidateName: string) => {
		console.log('🆕 createOrFindConversation called for:', { candidateId, candidateName })

		if (!user) {
			console.log('❌ No user, cannot create conversation')
			return null
		}

		// First check if conversation already exists in the loaded conversations
		console.log('🔍 Checking', conversations.length, 'loaded conversations')
		const existingConv = conversations.find(c => c.candidateId === candidateId)

		if (existingConv) {
			console.log('✅ Found existing conversation:', existingConv.conversationId)
			return existingConv
		}

		// If not found, create new conversation
		// We'll create a "draft" conversation object that will be persisted when first message is sent
		console.log('📝 Creating draft conversation with company name:', companyName)

		const draftConversation: Conversation = {
			conversationId: `draft_${candidateId}`, // Temporary ID
			companyId: user.uid,
			companyName: companyName,
			companyLogoUrl: companyLogoUrl,
			candidateId: candidateId,
			candidateName: candidateName,
			lastMessage: '',
			lastMessageTimestamp: null,
			lastMessageSenderId: '',
			participants: [user.uid, candidateId],
			unreadCount: {
				[user.uid]: 0,
				[candidateId]: 0
			},
			createdAt: null,
			updatedAt: null
		}

		console.log('✅ Draft conversation created:', draftConversation.conversationId)
		return draftConversation
	}

	// Handle sending a message
	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!newMessage.trim() || !selectedConversation || !user) return

		let conversationId = selectedConversation.conversationId

		// If this is a draft conversation, create it in Firestore first
		if (conversationId.startsWith('draft_')) {
			const conversationData = {
				companyId: user.uid,
				companyName: companyName,
				companyLogoUrl: companyLogoUrl,
				candidateId: selectedConversation.candidateId,
				candidateName: selectedConversation.candidateName,
				lastMessage: newMessage.trim(),
				lastMessageTimestamp: serverTimestamp(),
				lastMessageSenderId: user.uid,
				participants: [user.uid, selectedConversation.candidateId],
				unreadCount: {
					[user.uid]: 0,
					[selectedConversation.candidateId]: 1
				},
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp()
			}

			const docRef = await addDoc(collection(db, 'conversations'), conversationData)
			conversationId = docRef.id

			// Update the selected conversation with the real ID
			setSelectedConversation({
				...selectedConversation,
				conversationId: conversationId
			})
		}

		const messageData = {
			conversationId: conversationId,
			senderId: user.uid,
			senderType: 'company' as const,
			senderName: companyName,
			receiverId: selectedConversation.candidateId,
			receiverType: 'candidate' as const,
			receiverName: selectedConversation.candidateName,
			content: newMessage.trim(),
			attachments: [],
			read: false,
			timestamp: serverTimestamp(),
			createdAt: serverTimestamp()
		}

		await addDoc(collection(db, 'messages'), messageData)

		// Update conversation (only if not a draft, since draft was just created with message data)
		if (!selectedConversation.conversationId.startsWith('draft_')) {
			const conversationRef = doc(db, 'conversations', conversationId)
			await updateDoc(conversationRef, {
				companyName: companyName, // Update company name
				companyLogoUrl: companyLogoUrl, // Update company logo
				lastMessage: newMessage.trim(),
				lastMessageTimestamp: serverTimestamp(),
				lastMessageSenderId: user.uid,
				[`unreadCount.${selectedConversation.candidateId}`]: (selectedConversation.unreadCount[selectedConversation.candidateId] || 0) + 1,
				updatedAt: serverTimestamp()
			})
		}

		setNewMessage('')
	}

	// Handle file upload
	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || !selectedConversation || !user) return

		const file = e.target.files[0]
		if (!file) return

		setUploadingFile(true)

		try {
			let conversationId = selectedConversation.conversationId

			// If this is a draft conversation, create it in Firestore first
			if (conversationId.startsWith('draft_')) {
				const conversationData = {
					companyId: user.uid,
					companyName: companyName,
					companyLogoUrl: companyLogoUrl,
					candidateId: selectedConversation.candidateId,
					candidateName: selectedConversation.candidateName,
					lastMessage: `Archivo adjunto: ${file.name}`,
					lastMessageTimestamp: serverTimestamp(),
					lastMessageSenderId: user.uid,
					participants: [user.uid, selectedConversation.candidateId],
					unreadCount: {
						[user.uid]: 0,
						[selectedConversation.candidateId]: 1
					},
					createdAt: serverTimestamp(),
					updatedAt: serverTimestamp()
				}

				const docRef = await addDoc(collection(db, 'conversations'), conversationData)
				conversationId = docRef.id

				// Update the selected conversation with the real ID
				setSelectedConversation({
					...selectedConversation,
					conversationId: conversationId
				})
			}

			// Upload file to Firebase Storage
			const storageRef = ref(storage, `messages/${conversationId}/${Date.now()}_${file.name}`)
			await uploadBytes(storageRef, file)
			const downloadURL = await getDownloadURL(storageRef)

			const attachment: MessageAttachment = {
				name: file.name,
				url: downloadURL,
				type: file.type,
				size: file.size
			}

			const messageData = {
				conversationId: conversationId,
				senderId: user.uid,
				senderType: 'company' as const,
				senderName: companyName,
				receiverId: selectedConversation.candidateId,
				receiverType: 'candidate' as const,
				receiverName: selectedConversation.candidateName,
				content: `Archivo adjunto: ${file.name}`,
				attachments: [attachment],
				read: false,
				timestamp: serverTimestamp(),
				createdAt: serverTimestamp()
			}

			await addDoc(collection(db, 'messages'), messageData)

			// Update conversation (only if not a draft, since draft was just created with message data)
			if (!selectedConversation.conversationId.startsWith('draft_')) {
				const conversationRef = doc(db, 'conversations', conversationId)
				await updateDoc(conversationRef, {
					companyName: companyName, // Update company name
					companyLogoUrl: companyLogoUrl, // Update company logo
					lastMessage: `Archivo adjunto: ${file.name}`,
					lastMessageTimestamp: serverTimestamp(),
					lastMessageSenderId: user.uid,
					[`unreadCount.${selectedConversation.candidateId}`]: (selectedConversation.unreadCount[selectedConversation.candidateId] || 0) + 1,
					updatedAt: serverTimestamp()
				})
			}
		} catch (error) {
			console.error('Error uploading file:', error)
			alert('Error al subir el archivo')
		} finally {
			setUploadingFile(false)
		}
	}

	// Archive/Unarchive conversation
	const handleArchiveConversation = async () => {
		if (!selectedConversation || !user) return

		const conversationRef = doc(db, 'conversations', selectedConversation.conversationId)
		const archivedBy = selectedConversation.archivedBy || []

		const isArchived = archivedBy.includes(user.uid)

		if (isArchived) {
			// Unarchive - remove user from archivedBy array
			await updateDoc(conversationRef, {
				archivedBy: archivedBy.filter(id => id !== user.uid)
			})
		} else {
			// Archive - add user to archivedBy array
			await updateDoc(conversationRef, {
				archivedBy: [...archivedBy, user.uid]
			})
			// Deselect the conversation after archiving
			setSelectedConversation(null)
		}
	}

	// Delete/Unsend message (soft delete)
	const handleDeleteMessage = async (messageId: string, isRead: boolean) => {
		if (!user) return

		if (isRead) {
			alert('No puedes eliminar un mensaje que ya fue leído.')
			return
		}

		if (!confirm('¿Estás seguro de que deseas eliminar este mensaje?')) return

		try {
			const messageRef = doc(db, 'messages', messageId)
			await updateDoc(messageRef, {
				deleted: true,
				deletedAt: serverTimestamp(),
				deletedBy: user.uid
			})
		} catch (error) {
			console.error('Error deleting message:', error)
			alert('Error al eliminar el mensaje')
		}
	}

	// Toggle message actions
	const handleMessageClick = (messageId: string, isSent: boolean, canModify: boolean) => {
		// Only toggle for sent messages that can be modified
		if (isSent && canModify) {
			setActiveMessageId(activeMessageId === messageId ? null : messageId)
		}
	}

	// Edit message
	const handleStartEdit = (messageId: string, currentContent: string) => {
		setEditingMessageId(messageId)
		setEditingContent(currentContent)
		setActiveMessageId(null)
	}

	const handleCancelEdit = () => {
		setEditingMessageId(null)
		setEditingContent('')
	}

	const handleSaveEdit = async (messageId: string, isRead: boolean) => {
		if (!user || !editingContent.trim()) return

		if (isRead) {
			alert('No puedes editar un mensaje que ya fue leído.')
			handleCancelEdit()
			return
		}

		try {
			const messageRef = doc(db, 'messages', messageId)
			const messageDoc = await getDoc(messageRef)

			if (!messageDoc.exists()) return

			const originalContent = messageDoc.data().originalContent || messageDoc.data().content

			await updateDoc(messageRef, {
				content: editingContent.trim(),
				edited: true,
				editedAt: serverTimestamp(),
				originalContent: originalContent
			})

			handleCancelEdit()
		} catch (error) {
			console.error('Error editing message:', error)
			alert('Error al editar el mensaje')
		}
	}

	// Initialize conversation from URL params if needed
	useEffect(() => {
		const candidateId = searchParams.get('candidateId')
		const candidateName = searchParams.get('candidateName')

		console.log('🔗 URL params check:', { candidateId, candidateName, hasUser: !!user, loading })

		if (candidateId && candidateName && user && !loading) {
			console.log('✅ All conditions met for URL params initialization')

			// Check if we already have this conversation selected
			if (selectedConversation && selectedConversation.candidateId === candidateId) {
				console.log('✓ Conversation already selected, skipping')
				return // Already selected, no need to do anything
			}

			// Check if conversation exists in the list
			console.log('🔍 Searching for existing conversation in list of', conversations.length)
			const existingConv = conversations.find(c => c.candidateId === candidateId)

			if (existingConv) {
				console.log('✅ Found existing conversation in list:', existingConv.conversationId)
				setSelectedConversation(existingConv)
			} else {
				console.log('📝 Creating/finding conversation for candidate:', candidateId)
				// Create new conversation (or find if it exists in DB but not loaded yet)
				createOrFindConversation(candidateId, candidateName).then(conv => {
					if (conv) {
						console.log('✅ Conversation ready:', conv.conversationId)
						setSelectedConversation(conv)
					} else {
						console.log('❌ Failed to create/find conversation')
					}
				})
			}
		}
	}, [searchParams, user, conversations, loading, selectedConversation])

	// Loading state
	if (loading) {
		return (
			<div className="h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		)
	}

	// Not authenticated
	if (!user) {
		return (
			<div className="h-screen flex items-center justify-center">
				<p className="text-muted-foreground">Por favor, inicia sesión para ver tus mensajes.</p>
			</div>
		)
	}

	// Helper function: Get jobs that a candidate applied to
	const getJobsForCandidate = (candidateId: string) => {
		return applications
			.filter(app => app.candidateId === candidateId)
			.map(app => {
				const job = activeJobs.find(j => j.jobId === app.jobId)
				return {
					jobId: app.jobId,
					jobTitle: job?.jobTitle || 'Posición desconocida',
					status: app.pipelineStatus
				}
			})
	}

	// Filter conversations based on position, search, and archived status
	const filteredConversations = conversations.filter(conv => {
		const archivedBy = conv.archivedBy || []
		const isArchivedByUser = user ? archivedBy.includes(user.uid) : false

		// Filter by archived status
		if (showArchived && !isArchivedByUser) return false
		if (!showArchived && isArchivedByUser) return false

		// Filter by position/job
		if (selectedJobFilter !== 'all') {
			const candidateApplications = applications.filter(
				app => app.candidateId === conv.candidateId && app.jobId === selectedJobFilter
			)
			if (candidateApplications.length === 0) return false
		}

		// Filter by search query
		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			return (
				conv.candidateName?.toLowerCase().includes(query) ||
				conv.lastMessage?.toLowerCase().includes(query)
			)
		}

		return true
	})

	return (
		<div className="h-[calc(100vh-64px)] flex bg-gray-50">
			{/* Conversations List */}
			<div className="w-80 bg-white border-r border-gray-200 flex flex-col">
				<div className="p-4 border-b border-gray-200">
					<h2 className="text-xl font-bold text-foreground">Mensajes</h2>
					<p className="text-sm text-muted-foreground">{filteredConversations.length} conversaciones</p>

					{/* Position Filter Dropdown */}
					<div className="mt-3">
						<label className="text-xs font-medium text-gray-700 block mb-1">
							Filtrar por posición:
						</label>
						<select
							value={selectedJobFilter}
							onChange={e => setSelectedJobFilter(e.target.value)}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
						>
							<option value="all">Todas las posiciones</option>
							{activeJobs.map(job => {
								// Count applications for this job
								const applicationsCount = applications.filter(app => app.jobId === job.jobId).length
								return (
									<option key={job.jobId} value={job.jobId}>
										{job.jobTitle} ({applicationsCount})
									</option>
								)
							})}
						</select>
					</div>

					{/* Search Input */}
					<div className="mt-3">
						<input
							type="text"
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							placeholder="Buscar conversaciones..."
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					{/* Show Archived Toggle */}
					<div className="mt-3 flex items-center gap-2">
						<button
							onClick={() => setShowArchived(!showArchived)}
							className={`text-xs px-3 py-1 rounded-full transition-colors ${
								showArchived
									? 'bg-blue-600 text-white'
									: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
							}`}
						>
							{showArchived ? '📂 Mostrar activas' : '🗄️ Mostrar archivadas'}
						</button>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto">
					{filteredConversations.length === 0 ? (
						<div className="p-4 text-center text-muted-foreground">
							{searchQuery ? (
								<p>No se encontraron conversaciones.</p>
							) : showArchived ? (
								<p>No tienes conversaciones archivadas.</p>
							) : (
								<>
									<p>No tienes conversaciones aún.</p>
									<p className="text-sm mt-2">Inicia una conversación desde Búsqueda de Talento.</p>
								</>
							)}
						</div>
					) : (
						filteredConversations.map(conv => {
							const unreadCount = conv.unreadCount[user.uid] || 0
							const isSelected = selectedConversation?.conversationId === conv.conversationId
							const candidateJobs = getJobsForCandidate(conv.candidateId)

							return (
								<div
									key={conv.conversationId}
									onClick={() => setSelectedConversation(conv)}
									className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
										isSelected ? 'bg-blue-50' : ''
									}`}
								>
									<div className="flex justify-between items-start mb-1">
										<h3 className="font-semibold text-foreground">{conv.candidateName}</h3>
										{unreadCount > 0 && (
											<span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
												{unreadCount}
											</span>
										)}
									</div>
									<p className="text-sm text-muted-foreground truncate">{conv.lastMessage || 'Nueva conversación'}</p>

									{/* Show applied positions */}
									{candidateJobs.length > 0 && (
										<div className="mt-2 flex flex-wrap gap-1">
											<span className="text-xs text-gray-500">Aplicó a:</span>
											{candidateJobs.slice(0, 2).map((job, idx) => (
												<span
													key={job.jobId}
													className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
													title={job.jobTitle}
												>
													{job.jobTitle.length > 15 ? job.jobTitle.substring(0, 15) + '...' : job.jobTitle}
												</span>
											))}
											{candidateJobs.length > 2 && (
												<span className="text-xs text-gray-500">
													+{candidateJobs.length - 2} más
												</span>
											)}
										</div>
									)}

									{conv.lastMessageTimestamp && (
										<p className="text-xs text-muted-foreground mt-1">
											{conv.lastMessageTimestamp.toDate ?
												conv.lastMessageTimestamp.toDate().toLocaleDateString() :
												'Ahora'
											}
										</p>
									)}
								</div>
							)
						})
					)}
				</div>
			</div>

			{/* Messages Area */}
			<div className="flex-1 flex flex-col">
				{selectedConversation ? (
					<>
						{/* Conversation Header */}
						<div className="p-4 bg-white border-b border-gray-200">
							<div className="flex items-center justify-between">
								<div>
									<h2 className="text-lg font-semibold text-foreground">{selectedConversation.candidateName}</h2>
									<p className="text-sm text-muted-foreground">Candidato</p>
								</div>

								{/* Action Buttons */}
								<div className="flex items-center gap-2">
									<button
										onClick={handleArchiveConversation}
										className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
										title={selectedConversation.archivedBy?.includes(user.uid) ? 'Desarchivar' : 'Archivar conversación'}
									>
										{selectedConversation.archivedBy?.includes(user.uid) ? '📂 Desarchivar' : '🗄️ Archivar'}
									</button>
								</div>
							</div>
						</div>

						{/* Messages */}
						<div className="flex-1 overflow-y-auto p-4 space-y-4">
							{messages.map(message => {
								const isSent = message.senderId === user.uid
								const isDeleted = message.deleted
								const isEditing = editingMessageId === message.messageId

								// Can only modify if message hasn't been read yet
								const canModify = isSent && !message.read

								return (
									<div
										key={message.messageId}
										className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
									>
										<div className="flex flex-col max-w-[70%]">
											<div
												onClick={() => handleMessageClick(message.messageId, isSent, canModify)}
												className={`rounded-lg px-4 py-2 ${
													isSent
														? 'bg-blue-600 text-white'
														: 'bg-white text-foreground border border-gray-200'
												} ${isSent && canModify && !isDeleted && !isEditing ? 'cursor-pointer hover:opacity-90' : ''}`}
											>
												{isDeleted ? (
													<p className="text-sm italic opacity-60">Este mensaje fue eliminado</p>
												) : isEditing ? (
													<div className="space-y-2">
														<textarea
															value={editingContent}
															onChange={e => setEditingContent(e.target.value)}
															className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded resize-none focus:ring-2 focus:ring-blue-500"
															rows={3}
															autoFocus
														/>
														<div className="flex gap-2 justify-end">
															<button
																onClick={handleCancelEdit}
																className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
															>
																Cancelar
															</button>
															<button
																onClick={() => handleSaveEdit(message.messageId, message.read)}
																disabled={!editingContent.trim()}
																className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
															>
																Guardar
															</button>
														</div>
													</div>
												) : (
													<>
														<p className="text-sm break-words">{message.content}</p>
														{message.edited && (
															<span className="text-xs italic opacity-75 ml-1">(editado)</span>
														)}
													</>
												)}

												{/* Attachments */}
												{!isDeleted && message.attachments && message.attachments.length > 0 && (
													<div className="mt-2">
														{message.attachments.map((attachment, idx) => (
															<a
																key={idx}
																href={attachment.url}
																target="_blank"
																rel="noopener noreferrer"
																className={`text-xs underline block ${
																	isSent ? 'text-blue-100' : 'text-blue-600'
																}`}
															>
																📎 {attachment.name} ({Math.round(attachment.size / 1024)} KB)
															</a>
														))}
													</div>
												)}

												{!isEditing && (
													<div className={`flex items-center gap-1 text-xs mt-1 ${isSent ? 'text-blue-100' : 'text-muted-foreground'}`}>
														<span>
															{message.timestamp?.toDate ?
																message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
																'Ahora'
															}
														</span>
														{isSent && !isDeleted && (
															<span className="ml-1">
																{message.read ? '✓✓' : '✓'}
															</span>
														)}
													</div>
												)}
											</div>

											{/* Edit/Delete Buttons */}
											{!isDeleted && canModify && !isEditing && activeMessageId === message.messageId && (
												<div className="flex gap-1 mt-1">
													<button
														onClick={(e) => {
															e.stopPropagation()
															handleStartEdit(message.messageId, message.content)
														}}
														className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
														title="Editar mensaje (solo antes de ser leído)"
													>
														✏️ Editar
													</button>
													<button
														onClick={(e) => {
															e.stopPropagation()
															handleDeleteMessage(message.messageId, message.read)
															setActiveMessageId(null)
														}}
														className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
														title="Eliminar mensaje (solo antes de ser leído)"
													>
														🗑️ Eliminar
													</button>
												</div>
											)}
										</div>
									</div>
								)
							})}
							<div ref={messagesEndRef} />
						</div>

						{/* Message Input */}
						<div className="p-4 bg-white border-t border-gray-200">
							{/* Recipient Info */}
							<div className="mb-3 pb-2 border-b border-gray-100">
								<p className="text-sm text-muted-foreground">
									<span className="font-semibold">Para:</span> {selectedConversation.candidateName}
								</p>
							</div>
							<form onSubmit={handleSendMessage} className="flex gap-2">
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleFileUpload}
									className="hidden"
								/>
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									disabled={uploadingFile}
									className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
									title="Adjuntar archivo"
								>
									📎
								</button>
								<input
									type="text"
									value={newMessage}
									onChange={e => setNewMessage(e.target.value)}
									placeholder="Escribe un mensaje..."
									className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
								<button
									type="submit"
									disabled={!newMessage.trim()}
									className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Enviar
								</button>
							</form>
							{uploadingFile && (
								<p className="text-xs text-muted-foreground mt-2">Subiendo archivo...</p>
							)}
						</div>
					</>
				) : (
					<div className="flex-1 flex items-center justify-center">
						<div className="text-center text-muted-foreground">
							<p className="text-lg mb-2">Selecciona una conversación</p>
							<p className="text-sm">o inicia una nueva desde Búsqueda de Talento</p>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default CompanyInboxPage

