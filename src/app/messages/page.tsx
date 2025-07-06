// src/app/messages/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './messages.module.css'; // Import CSS Module
import Navbar from '@/components/Navbar';
import Link from 'next/link';

// Interfaces for data structure
interface Participant {
  _id: string;
  name: string;
  profilePicture?: string;
}

interface Message {
  _id: string;
  senderId: string;
  content: string;
  createdAt: string; // ISO Date string
}

interface Conversation {
  _id: string;
  participants: Participant[];
  lastMessage?: Message; // Optional last message preview
  updatedAt: string; // ISO Date string
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Effect to get current user ID and fetch initial conversations
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Decode token to get current user ID
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const decoded = JSON.parse(atob(parts[1]));
        setCurrentUserId(decoded.id);
      } else {
        throw new Error('Invalid token format');
      }
    } catch (e) {
      console.error('Failed to decode token:', e);
      localStorage.removeItem('token');
      router.push('/login');
      return;
    }

    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/user/conversations', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations);
          // Auto-select the first conversation if none is selected initially
          if (data.conversations.length > 0 && !selectedConversation) {
             setSelectedConversation(data.conversations[0]);
          }
        } else {
          const errorData = await res.json();
          setError(errorData.error || 'Failed to load conversations.');
          if (res.status === 401) {
            localStorage.removeItem('token');
            router.push('/login');
          }
        }
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
        setError('Network error loading conversations.');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
    // No polling for conversations here, done only once on component mount for now
  }, [router, selectedConversation]); // selectedConversation in dependency so it runs again if auto-selected


  // Effect to fetch messages when a conversation is selected (with polling)
  useEffect(() => {
    let messagePollingInterval: NodeJS.Timeout | null = null;

    const fetchMessages = async () => {
      if (!selectedConversation) {
        console.log("No conversation selected, skipping message fetch.");
        setMessages([]);
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        console.log("No token for fetching messages, skipping.");
        // If no token, maybe redirect to login or show an error
        setError('Authentication required to view messages.');
        return;
      }

      const messagesApiUrl = `/api/conversation/${selectedConversation._id}/messages`;
      console.log(`Fetching messages for conversation ID: ${selectedConversation._id} from URL: ${messagesApiUrl}`);

      try {
        const res = await fetch(messagesApiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!res.ok) {
          console.error(`API response not OK for ${messagesApiUrl}: Status ${res.status}`);
          const errorText = await res.text();
          console.error("Raw API response text:", errorText);
          try {
            const errorData = JSON.parse(errorText);
            setError(errorData.error || `Failed to load messages (Status: ${res.status}).`);
          } catch (jsonParseError) {
            setError(`Server returned non-JSON response (Status: ${res.status}). Check server logs. ` + 
                     `Response content: ${errorText.substring(0, 100)}...`);
          }
          return;
        }

        const data = await res.json();
        setMessages(data.messages);
        const messageContainer = document.getElementById('messageContainer');
        if (messageContainer) {
          // Use setTimeout to ensure DOM is updated before scrolling
          setTimeout(() => {
            messageContainer.scrollTop = messageContainer.scrollHeight;
          }, 0);
        }
      } catch (err) {
        console.error('Network error loading messages:', err);
        setError('Network error loading messages. Check console for details.');
      }
    };

    // Initial fetch
    fetchMessages();
    // Set up polling interval only if a conversation is selected
    if (selectedConversation) {
      messagePollingInterval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    }

    // Cleanup function for the effect
    return () => {
      if (messagePollingInterval) {
        clearInterval(messagePollingInterval); // Clear interval on unmount or dependency change
      }
    };
  }, [selectedConversation]); // Re-run effect when selectedConversation changes


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !newMessageContent.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required to send message.');
      router.push('/login');
      setIsSending(false);
      return;
    }

    try {
      const res = await fetch(`/api/conversation/${selectedConversation._id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessageContent }),
      });

      const data = await res.json();

      if (res.ok) {
        const sentMessage = data;
        setMessages(prev => [...prev, {
            _id: sentMessage.messageId || new Date().getTime().toString(),
            senderId: currentUserId!,
            content: newMessageContent,
            createdAt: new Date().toISOString()
        }]);
        setNewMessageContent('');
        const messageContainer = document.getElementById('messageContainer');
        if (messageContainer) {
          setTimeout(() => {
            messageContainer.scrollTop = messageContainer.scrollHeight;
          }, 0);
        }
      } else {
        setError(data.error || 'Failed to send message.');
      }
    } catch (err) {
      console.error('Send message network error:', err);
      setError('Network error sending message.');
    } finally {
      setIsSending(false);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p._id !== currentUserId);
  };

  const handleCloseChat = () => {
    // Instead of just clearing state, navigate to the dashboard
    router.push('/dashboard'); 
  };


  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading messages...</p>
          </div>
        </div>
      </>
    );
  }

  // Render the error state directly if an error occurs
  if (error) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <div className={styles.errorState}>
            <h2>Error:</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className={styles.buttonReload}>
              Try Again
            </button>
            {/* The Back to Dashboard link is always available here */}
            <Link href="/dashboard" className={styles.backToDashboardLink}>
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.chatWrapper}>
          <div className={styles.conversationList}>
            <h2 className={styles.listTitle}>Conversations</h2>
            {conversations.length === 0 ? (
              <p className={styles.noConversations}>No conversations yet. Start a chat with a friend!</p>
            ) : (
              conversations.map(conv => {
                const otherParticipant = getOtherParticipant(conv);
                return (
                  <div
                    key={conv._id}
                    className={`${styles.conversationItem} ${selectedConversation?._id === conv._id ? styles.selected : ''}`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    {otherParticipant?.profilePicture ? (
                      <img src={otherParticipant.profilePicture} alt={otherParticipant.name} className={styles.convPic} />
                    ) : (
                      <div className={styles.convPicPlaceholder}>
                        {otherParticipant?.name ? otherParticipant.name.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                    <div className={styles.convInfo}>
                      <h3>{otherParticipant?.name || 'Unknown User'}</h3>
                      {conv.lastMessage && (
                        <p className={styles.lastMessage}>{conv.lastMessage.content}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className={styles.chatWindow}>
            {selectedConversation ? (
              <>
                <div className={styles.chatHeader}>
                  {getOtherParticipant(selectedConversation)?.profilePicture ? (
                    <img src={getOtherParticipant(selectedConversation)?.profilePicture} alt={getOtherParticipant(selectedConversation)?.name} className={styles.chatHeaderPic} />
                  ) : (
                    <div className={styles.chatHeaderPicPlaceholder}>
                      {getOtherParticipant(selectedConversation)?.name ? getOtherParticipant(selectedConversation)!.name.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                  <h2>{getOtherParticipant(selectedConversation)?.name || 'Unknown User'}</h2>
                  {/* NEW: Close Chat Button */}
                  <button onClick={handleCloseChat} className={styles.closeChatButton}>
                    Close Chat
                  </button>
                </div>
                <div id="messageContainer" className={styles.messageContainer}>
                  {messages.length === 0 ? (
                    <p className={styles.noMessages}>Say hello!</p>
                  ) : (
                    messages.map(msg => (
                      <div key={msg._id} className={`${styles.messageBubble} ${msg.senderId === currentUserId ? styles.myMessage : styles.theirMessage}`}>
                        <p>{msg.content}</p>
                        <span className={styles.messageTime}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSendMessage} className={styles.messageInputForm}>
                  <input
                    type="text"
                    value={newMessageContent}
                    onChange={(e) => setNewMessageContent(e.target.value)}
                    placeholder="Type your message..."
                    className={styles.messageInput}
                    disabled={isSending}
                  />
                  <button type="submit" className={styles.sendMessageButton} disabled={isSending}>
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className={styles.noConversationSelected}>
                <p>Select a conversation to start chatting.</p>
                <p>Or find new people to connect with!</p>
                <Link href="/people/find" className={styles.findPeopleLink}>Find People</Link>
              </div>
            )}
          </div>
        </div>

        <div className={styles.backLinkContainer}>
          {/* The Back to Dashboard link is always available here */}
          <Link 
            href="/dashboard" 
            className={styles.backToDashboardLink}
            onClick={() => console.log('Attempting to navigate to dashboard from messages page.')} // Diagnostic log
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
