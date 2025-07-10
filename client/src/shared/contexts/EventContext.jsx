// client/src/shared/contexts/EventContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useAuth } from "@auth/hooks/useAuth";
import { UserService } from "@shared/services/user/UserService";
import { doc, onSnapshot, collection, query, where, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import { db } from "@shared/services/firebase/config";
import { eventsService } from "@dashboard/features/events/services/eventsService";
import { updateEvent, addEventMember } from "@shared/services/firebase/events";

// Actions
const EVENT_ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_EVENTS: "SET_EVENTS",
  SET_EVENT_MEMBERS: "SET_EVENT_MEMBERS",
  SET_EVENT_INVITATIONS: "SET_EVENT_INVITATIONS",
  UPDATE_EVENT: "UPDATE_EVENT",
  ADD_EVENT: "ADD_EVENT",
  REMOVE_EVENT: "REMOVE_EVENT",
  UPDATE_EVENT_MEMBERS: "UPDATE_EVENT_MEMBERS",
  ADD_EVENT_MEMBER: "ADD_EVENT_MEMBER",
  REMOVE_EVENT_MEMBER: "REMOVE_EVENT_MEMBER",
  UPDATE_EVENT_ADMINS: "UPDATE_EVENT_ADMINS",
  SET_ERROR: "SET_ERROR",
};

// Initial state
const initialState = {
  events: [], // All events user is part of
  eventMembers: {}, // Keyed by eventId: { eventId: [memberObjects] }
  eventInvitations: [], // Invitations TO current user
  eventInvitationIds: [], // Just event IDs for quick lookup
  sentEventInvitations: [], // Invitations FROM current user
  loading: true,
  error: null,
};

// Reducer
function eventReducer(state, action) {
  switch (action.type) {
    case EVENT_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case EVENT_ACTIONS.SET_EVENTS:
      return { ...state, events: action.payload };

    case EVENT_ACTIONS.SET_EVENT_MEMBERS:
      return {
        ...state,
        eventMembers: {
          ...state.eventMembers,
          [action.payload.eventId]: action.payload.members,
        },
      };

    case EVENT_ACTIONS.SET_EVENT_INVITATIONS:
      return {
        ...state,
        eventInvitations: action.payload,
        eventInvitationIds: action.payload.map((inv) => inv.eventId),
      };

    case EVENT_ACTIONS.UPDATE_EVENT:
      return {
        ...state,
        events: state.events.map((event) =>
          event.id === action.payload.id ? { ...event, ...action.payload } : event
        ),
      };

    case EVENT_ACTIONS.ADD_EVENT:
      return {
        ...state,
        events: [...state.events, action.payload],
      };

    case EVENT_ACTIONS.REMOVE_EVENT:
      const eventIdToRemove = action.payload;
      const { [eventIdToRemove]: removedMembers, ...remainingMembers } = state.eventMembers;
      return {
        ...state,
        events: state.events.filter((event) => event.id !== eventIdToRemove),
        eventMembers: remainingMembers,
      };

    case EVENT_ACTIONS.UPDATE_EVENT_MEMBERS:
      return {
        ...state,
        eventMembers: {
          ...state.eventMembers,
          [action.payload.eventId]: action.payload.members,
        },
        events: state.events.map((event) =>
          event.id === action.payload.eventId
            ? { ...event, members: action.payload.members.map((m) => m.uid) }
            : event
        ),
      };

    case EVENT_ACTIONS.ADD_EVENT_MEMBER:
      const { eventId: addEventId, member: newMember } = action.payload;
      const currentMembers = state.eventMembers[addEventId] || [];
      
      // Don't add if already exists
      if (currentMembers.some((m) => m.uid === newMember.uid)) {
        return state;
      }

      const updatedMembers = [...currentMembers, newMember];
      return {
        ...state,
        eventMembers: {
          ...state.eventMembers,
          [addEventId]: updatedMembers,
        },
        events: state.events.map((event) =>
          event.id === addEventId
            ? { ...event, members: [...(event.members || []), newMember.uid] }
            : event
        ),
      };

    case EVENT_ACTIONS.REMOVE_EVENT_MEMBER:
      const { eventId: removeEventId, memberId } = action.payload;
      const membersAfterRemoval = (state.eventMembers[removeEventId] || []).filter(
        (m) => m.uid !== memberId
      );
      
      return {
        ...state,
        eventMembers: {
          ...state.eventMembers,
          [removeEventId]: membersAfterRemoval,
        },
        events: state.events.map((event) =>
          event.id === removeEventId
            ? { 
                ...event, 
                members: (event.members || []).filter((uid) => uid !== memberId),
                admins: (event.admins || []).filter((uid) => uid !== memberId),
              }
            : event
        ),
      };

    case EVENT_ACTIONS.UPDATE_EVENT_ADMINS:
      return {
        ...state,
        events: state.events.map((event) =>
          event.id === action.payload.eventId
            ? { ...event, admins: action.payload.admins }
            : event
        ),
      };

    case EVENT_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };

    default:
      return state;
  }
}

// Context
const EventContext = createContext();

// Provider component
export const EventProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [state, dispatch] = useReducer(eventReducer, initialState);

  // DEFINE ALL ACTION FUNCTIONS FIRST
  const acceptEventInvitation = async (invitationId, eventId) => {
    try {
      console.log("🔧 DEBUG: Starting accept invitation (no functions)");
      console.log("🔧 DEBUG: invitationId:", invitationId);
      console.log("🔧 DEBUG: eventId:", eventId);
      console.log("🔧 DEBUG: currentUser.uid:", currentUser.uid);
      
      // STEP 1: Add user to event members array
      console.log("🔧 DEBUG: Adding user to event members...");
      await updateDoc(doc(db, "events", eventId), {
        members: arrayUnion(currentUser.uid),
        updatedAt: new Date().toISOString(),
      });
      console.log("🔧 DEBUG: User added to event successfully");
      
      // STEP 2: Update invitation status to accepted
      console.log("🔧 DEBUG: Updating invitation status...");
      await updateDoc(doc(db, "eventInvites", invitationId), {
        status: "accepted",
        acceptedAt: new Date().toISOString(),
      });
      console.log("🔧 DEBUG: Invitation status updated successfully");

      console.log("✅ SUCCESS: Invitation accepted without functions!");
      return true;
    } catch (error) {
      console.error("❌ ERROR: Failed to accept invitation:", error);
      console.error("❌ ERROR details:", {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  };

  const rejectEventInvitation = async (invitationId) => {
    try {
      console.log("❌ EventContext: Rejecting invitation:", invitationId);
      
      await updateDoc(doc(db, "eventInvites", invitationId), {
        status: "rejected",
        rejectedAt: new Date().toISOString(),
      });

      // Remove from pending immediately
      dispatch({
        type: EVENT_ACTIONS.SET_EVENT_INVITATIONS,
        payload: state.eventInvitations.filter((inv) => inv.id !== invitationId),
      });

      console.log("✅ EventContext: Invitation rejected successfully");
      return true;
    } catch (error) {
      console.error("❌ EventContext: Error rejecting event invitation:", error);
      throw error;
    }
  };

  const promoteToAdmin = async (eventId, userId) => {
    try {
      console.log("⬆️ EventContext: Promoting user to admin:", userId, "in event:", eventId);
      
      const event = state.events.find((e) => e.id === eventId);
      if (!event) throw new Error("Event not found");

      const updatedAdmins = [...(event.admins || []), userId];
      await updateEvent(eventId, { admins: updatedAdmins });

      // Update local state immediately for responsiveness
      dispatch({
        type: EVENT_ACTIONS.UPDATE_EVENT_ADMINS,
        payload: { eventId, admins: updatedAdmins },
      });

      console.log("✅ EventContext: User promoted to admin successfully");
      return true;
    } catch (error) {
      console.error("❌ EventContext: Error promoting user to admin:", error);
      throw error;
    }
  };

  const demoteFromAdmin = async (eventId, userId) => {
    try {
      console.log("⬇️ EventContext: Demoting user from admin:", userId, "in event:", eventId);
      
      const event = state.events.find((e) => e.id === eventId);
      if (!event) throw new Error("Event not found");

      const updatedAdmins = (event.admins || []).filter((uid) => uid !== userId);
      await updateEvent(eventId, { admins: updatedAdmins });

      // Update local state immediately
      dispatch({
        type: EVENT_ACTIONS.UPDATE_EVENT_ADMINS,
        payload: { eventId, admins: updatedAdmins },
      });

      console.log("✅ EventContext: User demoted from admin successfully");
      return true;
    } catch (error) {
      console.error("❌ EventContext: Error demoting user from admin:", error);
      throw error;
    }
  };

  const removeEventMember = async (eventId, userId) => {
    try {
      console.log("👤 EventContext: Removing member:", userId, "from event:", eventId);
      
      const event = state.events.find((e) => e.id === eventId);
      if (!event) throw new Error("Event not found");

      const updatedMembers = (event.members || []).filter((uid) => uid !== userId);
      const updatedAdmins = (event.admins || []).filter((uid) => uid !== userId);
      
      await updateEvent(eventId, {
        members: updatedMembers,
        admins: updatedAdmins,
      });

      // Update local state immediately
      dispatch({
        type: EVENT_ACTIONS.REMOVE_EVENT_MEMBER,
        payload: { eventId, memberId: userId },
      });

      console.log("✅ EventContext: Member removed successfully");
      return true;
    } catch (error) {
      console.error("❌ EventContext: Error removing event member:", error);
      throw error;
    }
  };

  const leaveEvent = async (eventId) => {
    console.log("🚪 EventContext: User leaving event:", eventId);
    return removeEventMember(eventId, currentUser.uid);
  };

  // Helper functions
  const getEventById = (eventId) => {
    return state.events.find((event) => event.id === eventId);
  };

  const getEventMembers = (eventId) => {
    return state.eventMembers[eventId] || [];
  };

  const isEventAdmin = (eventId, userId = currentUser?.uid) => {
    const event = getEventById(eventId);
    return event?.admins?.includes(userId) || false;
  };

  const isEventCreator = (eventId, userId = currentUser?.uid) => {
    const event = getEventById(eventId);
    return event?.createdBy === userId;
  };

  const isEventMember = (eventId, userId = currentUser?.uid) => {
    const event = getEventById(eventId);
    return event?.members?.includes(userId) || false;
  };

  const getUserEventRole = (eventId, userId = currentUser?.uid) => {
    if (isEventCreator(eventId, userId)) return "creator";
    if (isEventAdmin(eventId, userId)) return "admin";
    if (isEventMember(eventId, userId)) return "member";
    return "none";
  };

  // Set up real-time listeners
  useEffect(() => {
    console.log("🎬 EventContext: Setting up listeners for user:", currentUser?.uid);
    
    if (!currentUser?.uid) {
      console.log("❌ EventContext: No current user, skipping setup");
      dispatch({ type: EVENT_ACTIONS.SET_LOADING, payload: false });
      return;
    }

    let eventListeners = new Map(); // Track individual event listeners
    let unsubscribeEventInvitations;
    let unsubscribeUserEvents;

    const setupEventListeners = async () => {
      try {
        console.log("🚀 EventContext: Starting setup for user:", currentUser.uid);
        dispatch({ type: EVENT_ACTIONS.SET_LOADING, payload: true });

        // 1. Get initial events list
        console.log("📋 EventContext: Fetching initial events...");
        const userEvents = await eventsService.getEvents(currentUser.uid);
        console.log("✅ EventContext: Loaded", userEvents.length, "events");
        dispatch({ type: EVENT_ACTIONS.SET_EVENTS, payload: userEvents });

        // 2. Set up individual event listeners for each event
        userEvents.forEach((event) => {
          console.log("👂 EventContext: Setting up listener for event:", event.id);
          setupSingleEventListener(event.id);
        });

        // 3. Set up event invitations listener
        console.log("📨 EventContext: Setting up invitations listener...");
        const invitationsQuery = query(
          collection(db, "eventInvites"),
          where("inviteeUid", "==", currentUser.uid),
          where("status", "==", "pending")
        );

        unsubscribeEventInvitations = onSnapshot(invitationsQuery, async (snapshot) => {
        console.log("📨 EventContext: Invitations updated, count:", snapshot.docs.length);
        const invitations = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          try {
            // Get event details
            const eventDoc = await getDoc(doc(db, "events", data.eventId));
            if (eventDoc.exists()) {
              const eventData = eventDoc.data();
              
              // Get sender profile
              const senderProfile = await UserService.getUserProfile(data.inviterUid); // FIXED: Changed from "from" to "inviterUid"
              
              invitations.push({
                id: docSnap.id,
                ...data,
                eventTitle: eventData.title || eventData.name, // Support both title and name
                eventDescription: eventData.description,
                senderName: senderProfile?.displayName || "Unknown User",
                senderEmail: senderProfile?.email,
                senderPhotoURL: senderProfile?.photoURL,
              });
            }
          } catch (error) {
            console.warn(`Failed to fetch invitation details ${docSnap.id}:`, error);
          }
        }

        console.log("✅ EventContext: Processed", invitations.length, "invitations");
        dispatch({
          type: EVENT_ACTIONS.SET_EVENT_INVITATIONS,
          payload: invitations,
        });
      });

        // 4. Set up listener for new events user gets added to
        console.log("👥 EventContext: Setting up user events listener...");
        const userEventsQuery = query(
          collection(db, "events"),
          where("members", "array-contains", currentUser.uid)
        );

        unsubscribeUserEvents = onSnapshot(userEventsQuery, (snapshot) => {
          console.log("👥 EventContext: User events updated");
          snapshot.docChanges().forEach((change) => {
            const eventData = { id: change.doc.id, ...change.doc.data() };
            
            if (change.type === "added") {
              // New event user was added to
              if (!eventListeners.has(change.doc.id)) {
                console.log("➕ EventContext: User added to new event:", change.doc.id);
                dispatch({ type: EVENT_ACTIONS.ADD_EVENT, payload: eventData });
                setupSingleEventListener(change.doc.id);
              }
            } else if (change.type === "removed") {
              // User was removed from event
              console.log("➖ EventContext: User removed from event:", change.doc.id);
              const unsubscribe = eventListeners.get(change.doc.id);
              if (unsubscribe) {
                unsubscribe();
                eventListeners.delete(change.doc.id);
              }
              dispatch({ type: EVENT_ACTIONS.REMOVE_EVENT, payload: change.doc.id });
            }
          });
        });

        dispatch({ type: EVENT_ACTIONS.SET_LOADING, payload: false });
        console.log("✅ EventContext: Setup complete");
      } catch (error) {
        console.error("❌ EventContext: Error setting up listeners:", error);
        dispatch({ type: EVENT_ACTIONS.SET_ERROR, payload: error.message });
        dispatch({ type: EVENT_ACTIONS.SET_LOADING, payload: false });
      }
    };

    const setupSingleEventListener = (eventId) => {
      // Skip if listener already exists
      if (eventListeners.has(eventId)) {
        console.log("⏭️ EventContext: Listener already exists for event:", eventId);
        return;
      }

      console.log("🎧 EventContext: Creating listener for event:", eventId);
      const eventDocRef = doc(db, "events", eventId);
      const unsubscribe = onSnapshot(eventDocRef, async (docSnap) => {
        if (!docSnap.exists()) {
          // Event was deleted
          console.log("🗑️ EventContext: Event deleted:", eventId);
          dispatch({ type: EVENT_ACTIONS.REMOVE_EVENT, payload: eventId });
          return;
        }

        const eventData = { id: docSnap.id, ...docSnap.data() };
        console.log("🔄 EventContext: Event updated:", eventId);
        
        // Update event data
        dispatch({ type: EVENT_ACTIONS.UPDATE_EVENT, payload: eventData });

        // Update members if they changed
        const memberIds = eventData.members || [];
        if (memberIds.length > 0) {
          try {
            const memberProfiles = await eventsService.getEventMembers(memberIds);
            console.log("👥 EventContext: Updated members for event:", eventId, "count:", memberProfiles.length);
            dispatch({
              type: EVENT_ACTIONS.UPDATE_EVENT_MEMBERS,
              payload: {
                eventId,
                members: memberProfiles,
              },
            });
          } catch (error) {
            console.error(`❌ EventContext: Error fetching members for event ${eventId}:`, error);
          }
        } else {
          // No members
          dispatch({
            type: EVENT_ACTIONS.SET_EVENT_MEMBERS,
            payload: { eventId, members: [] },
          });
        }
      }, (error) => {
        console.error(`❌ EventContext: Listener error for event ${eventId}:`, error);
      });

      eventListeners.set(eventId, unsubscribe);
    };

    setupEventListeners();

    // Cleanup function
    return () => {
      console.log("🧹 EventContext: Cleaning up listeners");
      // Clean up all event listeners
      eventListeners.forEach((unsubscribe, eventId) => {
        console.log("🧹 EventContext: Cleaning up listener for event:", eventId);
        unsubscribe();
      });
      eventListeners.clear();
      
      if (unsubscribeEventInvitations) {
        console.log("🧹 EventContext: Cleaning up invitations listener");
        unsubscribeEventInvitations();
      }
      if (unsubscribeUserEvents) {
        console.log("🧹 EventContext: Cleaning up user events listener");
        unsubscribeUserEvents();
      }
    };
  }, [currentUser?.uid]);

  // NOW CREATE THE CONTEXT VALUE AFTER ALL FUNCTIONS ARE DEFINED
  const contextValue = {
    // State
    ...state,

    // Actions
    acceptEventInvitation,
    rejectEventInvitation,
    promoteToAdmin,
    demoteFromAdmin,
    removeEventMember,
    leaveEvent,

    // Helpers
    getEventById,
    getEventMembers,
    isEventAdmin,
    isEventCreator,
    isEventMember,
    getUserEventRole,
  };

  console.log("🎯 EventContext: Providing context with state:", {
    eventsCount: state.events.length,
    loading: state.loading,
    error: state.error,
    invitationsCount: state.eventInvitations.length,
  });

  return (
    <EventContext.Provider value={contextValue}>
      {children}
    </EventContext.Provider>
  );
};

// Hook to use the context
export const useEventContext = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEventContext must be used within an EventProvider");
  }
  return context;
};