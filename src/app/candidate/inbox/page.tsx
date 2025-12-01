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
import { Conversation, Message, MessageAttachment } from '../../../types'

const CandidateInboxPage = () => {
	console.log('🚀🚀🚀 CANDIDATE INBOX PAGE LOADED 🚀🚀🚀')

	const [user, setUser] = useState(auth.currentUser)
	const [conversations, setConversations] = useState<Conversation[]>([])
	const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
	const [messages, setMessages] = useState<Message[]>([])
	const [companyNames, setCompanyNames] = useState<{[key: string]: {name: string, logo: string}}>({})
	const [newMessage, setNewMessage] = useState('')
	const [loading, setLoading] = useState(true)
	const [uploadingFile, setUploadingFile] = useState(false)
	const [showArchived, setShowArchived] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
	const [editingContent, setEditingContent] = useState('')
	const [activeMessageId, setActiveMessageId] = useState<string | null>(null)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	console.log('📊 Component state:', {
		hasUser: !!user,
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

	// Fetch conversations
	useEffect(() => {
		console.log('🔄 Setting up conversations listener (CANDIDATE)')

		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser)

			if (!currentUser) {
				console.log('❌ No authenticated user for conversations (CANDIDATE)')
				setLoading(false)
				return
			}

			console.log('✅ User authenticated (CANDIDATE), fetching conversations for:', currentUser.uid)

			// Query conversations where this candidate is a participant
			const conversationsQuery = query(
				collection(db, 'conversations'),
				where('participants', 'array-contains', currentUser.uid),
				orderBy('lastMessageTimestamp', 'desc')
			)

			console.log('📡 Starting conversations snapshot listener (CANDIDATE)...')

			const unsubscribe = onSnapshot(conversationsQuery,
				(querySnapshot) => {
					console.log('💬 Conversations snapshot received (CANDIDATE), count:', querySnapshot.size)

					const conversationsData: Conversation[] = []
					querySnapshot.forEach(doc => {
						const data = doc.data()
						console.log('📝 Conversation (CANDIDATE):', doc.id, data)
						conversationsData.push({
							conversationId: doc.id,
							...data
						} as Conversation)
					})

					setConversations(conversationsData)
					setLoading(false)
					console.log('✅ Conversations loaded (CANDIDATE):', conversationsData.length)

					// Fetch actual company names from database
					conversationsData.forEach(async (conv) => {
						try {
							const userDoc = await getDoc(doc(db, 'users', conv.companyId))
							if (userDoc.exists()) {
								const userData = userDoc.data()
								const companyData = userData.companyData || {}
								setCompanyNames(prev => ({
									...prev,
									[conv.companyId]: {
										name: companyData.companyName || conv.companyName,
										logo: companyData.logoUrl || conv.companyLogoUrl || ''
									}
								}))
							}
						} catch (error) {
							console.error('Error fetching company name:', error)
						}
					})

					// Auto-select first conversation if available
					if (conversationsData.length > 0 && !selectedConversation) {
						console.log('🎯 Auto-selecting first conversation (CANDIDATE):', conversationsData[0].conversationId)
						setSelectedConversation(conversationsData[0])
					}
				},
				(error) => {
					// Ignore permission errors when user signs out
					if (error.code === 'permission-denied') {
						console.log('🔒 Conversations listener (CANDIDATE): User signed out, ignoring permission error')
						setLoading(false)
						return
					}
					console.error('❌ ERROR fetching conversations (CANDIDATE):', error)
					console.error('Error code:', error.code)
					console.error('Error message:', error.message)
					setLoading(false)
				}
			)

			return () => {
				console.log('🛑 Unsubscribing from conversations listener (CANDIDATE)')
				unsubscribe()
			}
		})

		return () => {
			console.log('🛑 Unsubscribing from auth listener (CANDIDATE)')
			unsubscribeAuth()
		}
	}, [])

	// Fetch messages for selected conversation
	useEffect(() => {
		console.log('💬 Messages effect triggered (CANDIDATE), selectedConversation:', selectedConversation?.conversationId)

		if (!selectedConversation) {
			console.log('⚠️ No selected conversation (CANDIDATE)')
			return
		}

		console.log('📡 Setting up messages listener (CANDIDATE) for conversation:', selectedConversation.conversationId)

		const messagesQuery = query(
			collection(db, 'messages'),
			where('conversationId', '==', selectedConversation.conversationId),
			orderBy('timestamp', 'asc')
		)

		const unsubscribe = onSnapshot(messagesQuery,
			(querySnapshot) => {
				console.log('✉️ Messages snapshot received (CANDIDATE), count:', querySnapshot.size)

				const messagesData: Message[] = []
				querySnapshot.forEach(doc => {
					const data = doc.data()
					console.log('📨 Message (CANDIDATE):', doc.id, data)
					messagesData.push({
						messageId: doc.id,
						...data
					} as Message)
				})

				setMessages(messagesData)
				console.log('✅ Messages loaded (CANDIDATE):', messagesData.length)

				// Mark messages as read
				markMessagesAsRead()
			},
			(error) => {
				// Ignore permission errors when user signs out
				if (error.code === 'permission-denied') {
					console.log('🔒 Messages listener (CANDIDATE): User signed out, ignoring permission error')
					return
				}
				console.error('❌ ERROR fetching messages (CANDIDATE):', error)
				console.error('Error code:', error.code)
				console.error('Error message:', error.message)
			}
		)

		return () => {
			console.log('🛑 Unsubscribing from messages listener (CANDIDATE)')
			unsubscribe()
		}
	}, [selectedConversation])

	// Mark messages as read
	const markMessagesAsRead = async () => {
		if (!selectedConversation || !user) return

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

	// Handle sending a message
	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!newMessage.trim() || !selectedConversation || !user) return

		const messageData = {
			conversationId: selectedConversation.conversationId,
			senderId: user.uid,
			senderType: 'candidate' as const,
			senderName: user.displayName || 'Candidate',
			receiverId: selectedConversation.companyId,
			receiverType: 'company' as const,
			receiverName: selectedConversation.companyName,
			content: newMessage.trim(),
			attachments: [],
			read: false,
			timestamp: serverTimestamp(),
			createdAt: serverTimestamp()
		}

		await addDoc(collection(db, 'messages'), messageData)

		// Update conversation
		const conversationRef = doc(db, 'conversations', selectedConversation.conversationId)
		await updateDoc(conversationRef, {
			lastMessage: newMessage.trim(),
			lastMessageTimestamp: serverTimestamp(),
			lastMessageSenderId: user.uid,
			[`unreadCount.${selectedConversation.companyId}`]: (selectedConversation.unreadCount[selectedConversation.companyId] || 0) + 1,
			updatedAt: serverTimestamp()
		})

		setNewMessage('')
	}

	// Handle file upload
	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || !selectedConversation || !user) return

		const file = e.target.files[0]
		if (!file) return

		setUploadingFile(true)

		try {
			// Upload file to Firebase Storage
			const storageRef = ref(storage, `messages/${selectedConversation.conversationId}/${Date.now()}_${file.name}`)
			await uploadBytes(storageRef, file)
			const downloadURL = await getDownloadURL(storageRef)

			const attachment: MessageAttachment = {
				name: file.name,
				url: downloadURL,
				type: file.type,
				size: file.size
			}

			const messageData = {
				conversationId: selectedConversation.conversationId,
				senderId: user.uid,
				senderType: 'candidate' as const,
				senderName: user.displayName || 'Candidate',
				receiverId: selectedConversation.companyId,
				receiverType: 'company' as const,
				receiverName: selectedConversation.companyName,
				content: `Archivo adjunto: ${file.name}`,
				attachments: [attachment],
				read: false,
				timestamp: serverTimestamp(),
				createdAt: serverTimestamp()
			}

			await addDoc(collection(db, 'messages'), messageData)

			// Update conversation
			const conversationRef = doc(db, 'conversations', selectedConversation.conversationId)
			await updateDoc(conversationRef, {
				lastMessage: `Archivo adjunto: ${file.name}`,
				lastMessageTimestamp: serverTimestamp(),
				lastMessageSenderId: user.uid,
				[`unreadCount.${selectedConversation.companyId}`]: (selectedConversation.unreadCount[selectedConversation.companyId] || 0) + 1,
				updatedAt: serverTimestamp()
			})
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

	// Filter conversations based on search and archived status
	const filteredConversations = conversations.filter(conv => {
		const archivedBy = conv.archivedBy || []
		const isArchivedByUser = user ? archivedBy.includes(user.uid) : false

		// Filter by archived status
		if (showArchived && !isArchivedByUser) return false
		if (!showArchived && isArchivedByUser) return false

		// Filter by search query
		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			const companyName = companyNames[conv.companyId]?.name || conv.companyName
			return (
				companyName?.toLowerCase().includes(query) ||
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
									<p className="text-sm mt-2">Las empresas pueden contactarte sobre oportunidades.</p>
								</>
							)}
						</div>
					) : (
						filteredConversations.map(conv => {
							const unreadCount = conv.unreadCount[user.uid] || 0
							const isSelected = selectedConversation?.conversationId === conv.conversationId
							const companyInfo = companyNames[conv.companyId] || { name: conv.companyName, logo: conv.companyLogoUrl }

							return (
								<div
									key={conv.conversationId}
									onClick={() => setSelectedConversation(conv)}
									className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
										isSelected ? 'bg-blue-50' : ''
									}`}
								>
									<div className="flex justify-between items-start mb-1">
										<div className="flex items-center gap-2">
											{/* Company Logo */}
											<div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
												{companyInfo.logo ? (
													<img
														src={companyInfo.logo}
														alt={companyInfo.name}
														className="w-full h-full object-cover"
													/>
												) : (
													<span className="text-xs font-semibold text-gray-600">
														{companyInfo.name?.charAt(0) || 'C'}
													</span>
												)}
											</div>
											<h3 className="font-semibold text-foreground">{companyInfo.name}</h3>
										</div>
										{unreadCount > 0 && (
											<span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
												{unreadCount}
											</span>
										)}
									</div>
									<p className="text-sm text-muted-foreground truncate">{conv.lastMessage || 'Nueva conversación'}</p>
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
								<div className="flex items-center gap-3">
									{/* Company Logo */}
									<div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
										{(companyNames[selectedConversation.companyId]?.logo || selectedConversation.companyLogoUrl) ? (
											<img
												src={companyNames[selectedConversation.companyId]?.logo || selectedConversation.companyLogoUrl}
												alt={companyNames[selectedConversation.companyId]?.name || selectedConversation.companyName}
												className="w-full h-full object-cover"
											/>
										) : (
											<span className="text-lg font-semibold text-gray-600">
												{(companyNames[selectedConversation.companyId]?.name || selectedConversation.companyName)?.charAt(0) || 'C'}
											</span>
										)}
									</div>
									<div>
										<h2 className="text-lg font-semibold text-foreground">{companyNames[selectedConversation.companyId]?.name || selectedConversation.companyName}</h2>
										<p className="text-sm text-muted-foreground">Empresa</p>
									</div>
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
									<span className="font-semibold">Para:</span> {companyNames[selectedConversation.companyId]?.name || selectedConversation.companyName}
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
							<p className="text-sm">para ver tus mensajes</p>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default CandidateInboxPage

